/**
 * /api/fpg/v1/clients/[id]/kyc/status
 *
 *   GET    Get current KYC stage, issues and required next step.
 *   PATCH  FPG-internal: set the KYC decision. Emits a webhook.
 *
 *           Body: { status: "approved" | "rejected" | "resubmit_required" |
 *                            "document_missing" | "compliance_hold" |
 *                            "enhanced_due_diligence" | "under_review",
 *                   reason?: string, document?: string,
 *                   next_step?: string }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type {
  KycStatus,
  WebhookEventType,
} from "@/server/types";

const StatusPatch = z.object({
  status: z.enum([
    "pending",
    "under_review",
    "approved",
    "rejected",
    "resubmit_required",
    "document_missing",
    "compliance_hold",
    "enhanced_due_diligence",
  ]),
  reason: z.string().optional(),
  document: z.string().optional(),
  next_step: z.string().optional(),
});

const VALID_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  pending: ["under_review", "document_missing", "compliance_hold", "approved", "rejected"],
  under_review: ["approved", "rejected", "resubmit_required", "compliance_hold", "enhanced_due_diligence"],
  approved: ["enhanced_due_diligence", "compliance_hold", "rejected"],
  rejected: ["resubmit_required"],
  resubmit_required: ["under_review", "rejected"],
  document_missing: ["under_review", "rejected"],
  compliance_hold: ["approved", "rejected", "enhanced_due_diligence"],
  enhanced_due_diligence: ["approved", "rejected", "compliance_hold"],
};

const KYC_TO_EVENT: Partial<Record<KycStatus, WebhookEventType>> = {
  approved: "kyc_approved",
  rejected: "kyc_rejected",
  resubmit_required: "kyc_resubmit_required",
  document_missing: "document_missing",
  compliance_hold: "compliance_hold",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/kyc/status", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      const docs = db.kycDocuments.filter((d) => d.clientApexId === client.apexId);
      return signAndSend(
        {
          client_apex_id: client.apexId,
          client_fpg_id: client.fpgId,
          status: client.kyc,
          documents_count: docs.length,
          documents: docs.map((d) => ({
            kind: d.kind,
            status: d.status,
            rejection_reason: d.rejectionReason,
          })),
          suitability: client.suitability,
        },
        ctx
      );
    }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/kyc/status", scopes: ["kyc.upload"] },
    async ({ ctx, body, finalize }) => {
      const { id } = await params;
      const parsed = StatusPatch.safeParse(body);
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
      const allowed = VALID_TRANSITIONS[client.kyc];
      if (!allowed.includes(b.status)) {
        return fpgError(
          422,
          "fpg.kyc_invalid_transition",
          `Cannot transition from ${client.kyc} to ${b.status}`,
          ctx,
          { details: { current: client.kyc, allowed } }
        );
      }
      await tx(async (d) => {
        const c = d.clients.find((x) => x.id === client.id);
        if (!c) return;
        c.kyc = b.status;
        if (b.status === "approved") c.status = "approved";
        if (b.status === "rejected") c.status = "rejected";
        if (b.status === "compliance_hold") c.status = "suspended";
        c.updatedAt = nowIso();
      });
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "PATCH /v1/clients/:id/kyc/status",
        target: `${client.apexId} → ${b.status}${b.reason ? ` (${b.reason})` : ""}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      const eventType = KYC_TO_EVENT[b.status];
      if (eventType) {
        await dispatchEvent(
          eventType,
          {
            client_apex_id: client.apexId,
            client_fpg_id: client.fpgId,
            apex_correlation_id: client.apexId,
            reason: b.reason,
            document: b.document,
            next_step: b.next_step,
          },
          { clientApexId: client.apexId, clientFpgId: client.fpgId ?? undefined }
        );
      }
      const resp = {
        client_apex_id: client.apexId,
        client_fpg_id: client.fpgId,
        status: b.status,
        updated_at: nowIso(),
      };
      await finalize({ body: resp, status: 200 });
      return signAndSend(resp, ctx);
    }
  );
}
