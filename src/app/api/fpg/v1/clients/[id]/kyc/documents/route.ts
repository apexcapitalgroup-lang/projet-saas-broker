/**
 * /api/fpg/v1/clients/[id]/kyc/documents
 *
 *   POST  Upload a KYC document for the client.
 *   GET   List all documents on file for the client.
 *
 * Scopes: kyc.upload (POST), read (GET).
 *
 * Status side effect: when ≥ 2 documents are uploaded, client KYC moves
 * to `under_review`. Final decision goes through PATCH /kyc/status.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { sha256 } from "@/server/crypto";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type { KycDocument } from "@/server/types";

const MAX_BYTES = 8 * 1024 * 1024;

const DocBody = z.object({
  kind: z.enum([
    "id_front",
    "id_back",
    "passport",
    "selfie",
    "proof_of_address",
    "source_of_funds",
    "incorporation_certificate",
    "ubo_register",
    "directors_register",
    "board_resolution",
  ]),
  filename: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().positive().max(MAX_BYTES),
  // Truncated content for the demo (or empty for an out-of-band upload).
  content_base64: z.string().optional(),
});

function present(doc: KycDocument) {
  return {
    document_id: doc.id,
    client_fpg_id: doc.clientFpgId,
    client_apex_id: doc.clientApexId,
    kind: doc.kind,
    filename: doc.filename,
    mime: doc.mime,
    bytes: doc.bytes,
    sha256: doc.sha256,
    status: doc.status,
    uploaded_at: doc.uploadedAt,
    reviewed_at: doc.reviewedAt,
    rejection_reason: doc.rejectionReason,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/kyc/documents", scopes: ["kyc.upload"] },
    async ({ ctx, body, finalize }) => {
      const { id } = await params;
      const parsed = DocBody.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const b = parsed.data;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      // Compute hash from the content if provided
      const truncated = (b.content_base64 ?? "").slice(0, 5460); // ≤ 4 KB binary
      const hash = sha256(b.content_base64 ?? `${client.apexId}-${b.kind}`);
      const doc: KycDocument = {
        id: newId("doc"),
        clientApexId: client.apexId,
        clientFpgId: client.fpgId,
        kind: b.kind,
        filename: b.filename,
        mime: b.mime,
        bytes: b.bytes,
        sha256: hash,
        status: "uploaded",
        uploadedAt: nowIso(),
        contentBase64Truncated: truncated || undefined,
      };
      let countAfter = 0;
      await tx(async (d) => {
        d.kycDocuments.unshift(doc);
        countAfter = d.kycDocuments.filter((x) => x.clientApexId === client.apexId).length;
        // Auto-transition to under_review after 2+ docs if currently pending/missing
        if (
          countAfter >= 2 &&
          (client.kyc === "pending" || client.kyc === "document_missing")
        ) {
          const c = d.clients.find((x) => x.id === client.id);
          if (c) {
            c.kyc = "under_review";
            c.updatedAt = nowIso();
          }
        }
      });
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/clients/:id/kyc/documents",
        target: `${client.apexId} · ${b.kind}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });

      // Emit kyc_submitted webhook on first doc, under_review when count hits threshold
      if (countAfter === 1) {
        await dispatchEvent(
          "kyc_submitted",
          { client_apex_id: client.apexId, client_fpg_id: client.fpgId, document: b.kind },
          { clientApexId: client.apexId, clientFpgId: client.fpgId ?? undefined }
        );
      }

      const resp = { document: present(doc), documents_count: countAfter };
      await finalize({ body: resp, status: 201 });
      return signAndSend(resp, ctx, { status: 201 });
    }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/kyc/documents", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      const docs = db.kycDocuments
        .filter((d) => d.clientApexId === client.apexId)
        .map(present);
      return signAndSend({ documents: docs }, ctx);
    }
  );
}
