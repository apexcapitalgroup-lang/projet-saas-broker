/**
 * POST /api/admin/kyc/[apexId]/decision
 *
 * Admin-only. Forwards a KYC decision to the FPG mock layer.
 * Body: { decision: "approve" | "reject" | "resubmit" | "compliance_hold",
 *         reason?: string, document?: string }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { adminGuard } from "@/server/guards";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";
import type { KycStatus, WebhookEventType } from "@/server/types";

const Body = z.object({
  decision: z.enum(["approve", "reject", "resubmit", "compliance_hold", "eed"]),
  reason: z.string().optional(),
  document: z.string().optional(),
  next_step: z.string().optional(),
});

const MAP: Record<string, { next: KycStatus; event: WebhookEventType }> = {
  approve: { next: "approved", event: "kyc_approved" },
  reject: { next: "rejected", event: "kyc_rejected" },
  resubmit: { next: "resubmit_required", event: "kyc_resubmit_required" },
  compliance_hold: { next: "compliance_hold", event: "compliance_hold" },
  eed: { next: "enhanced_due_diligence", event: "kyc_approved" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ apexId: string }> }
) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const { apexId } = await params;
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const b = parsed.data;
    const m = MAP[b.decision];
    const db = await getDb();
    const c = db.clients.find((x) => x.apexId === apexId);
    if (!c) return jsonError(404, "client.not_found", `No client with apex_id=${apexId}`);
    await tx(async (d) => {
      const target = d.clients.find((x) => x.apexId === apexId);
      if (!target) return;
      target.kyc = m.next;
      if (m.next === "approved") target.status = "approved";
      if (m.next === "rejected") target.status = "rejected";
      if (m.next === "compliance_hold") target.status = "suspended";
      target.updatedAt = nowIso();
    });
    await audit({
      actor: guard.session.user.name,
      actorRole: guard.session.user.role,
      action: `KYC decision: ${b.decision}`,
      target: `${apexId} → ${m.next}${b.reason ? ` (${b.reason})` : ""}`,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      result: "success",
    });
    await dispatchEvent(
      m.event,
      {
        client_apex_id: c.apexId,
        client_fpg_id: c.fpgId,
        apex_correlation_id: c.apexId,
        reason: b.reason,
        document: b.document,
        next_step: b.next_step,
      },
      { clientApexId: c.apexId, clientFpgId: c.fpgId ?? undefined }
    );
    return jsonOk({ apex_id: apexId, status: m.next });
  });
}
