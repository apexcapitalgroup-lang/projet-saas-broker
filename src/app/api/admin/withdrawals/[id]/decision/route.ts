/**
 * POST /api/admin/withdrawals/[id]/decision
 *
 * Admin-only. Forwards a withdrawal decision to the FPG mock layer.
 *
 * Body: { decision: "approve" | "reject" | "processing" | "complete" | "fail",
 *         reason?: string }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { adminGuard } from "@/server/guards";
import { nowIso } from "@/lib/now";
import { tx, findWithdrawal } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";
import type { WebhookEventType, WithdrawalStatus } from "@/server/types";

const Body = z.object({
  decision: z.enum(["approve", "reject", "processing", "complete", "fail"]),
  reason: z.string().optional(),
});

const MAP: Record<string, { next: WithdrawalStatus; event: WebhookEventType }> = {
  approve: { next: "approved", event: "withdrawal_approved" },
  reject: { next: "rejected", event: "withdrawal_rejected" },
  processing: { next: "processing", event: "withdrawal_processing" },
  complete: { next: "completed", event: "withdrawal_completed" },
  fail: { next: "failed", event: "withdrawal_failed" },
};

const ALLOWED_FROM: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  requested: ["under_review", "approved", "rejected"],
  under_review: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["completed", "failed"],
  completed: [],
  rejected: [],
  failed: [],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const { id } = await params;
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const b = parsed.data;
    const w = await findWithdrawal(id);
    if (!w) return jsonError(404, "withdrawal.not_found", `No withdrawal with id=${id}`);
    const transition = MAP[b.decision];
    if (!ALLOWED_FROM[w.status].includes(transition.next)) {
      return jsonError(
        422,
        "withdrawal.invalid_transition",
        `Cannot transition from ${w.status} to ${transition.next}`,
        { details: { current: w.status, allowed: ALLOWED_FROM[w.status] } }
      );
    }
    await tx(async (d) => {
      const target = d.withdrawals.find((x) => x.id === w.id);
      if (!target) return;
      target.status = transition.next;
      target.reviewerId = guard.session.user.id;
      target.updatedAt = nowIso();
      if (b.decision === "reject" || b.decision === "fail") {
        target.rejectionReason = b.reason;
      }
    });
    await audit({
      actor: guard.session.user.name,
      actorRole: guard.session.user.role,
      action: `${b.decision} withdrawal`,
      target: `${w.id} · ${w.amount} ${w.currency}${b.reason ? ` (${b.reason})` : ""}`,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      result: "success",
    });
    await dispatchEvent(
      transition.event,
      {
        withdrawal_id: w.id,
        fpg_txn_id: w.fpgTxnId,
        client_apex_id: w.clientApexId,
        client_fpg_id: w.clientFpgId,
        reason: b.reason,
      },
      { clientApexId: w.clientApexId, clientFpgId: w.clientFpgId }
    );
    return jsonOk({ withdrawal_id: w.id, status: transition.next });
  });
}
