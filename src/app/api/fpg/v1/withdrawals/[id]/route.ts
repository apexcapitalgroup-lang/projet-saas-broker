/**
 * /api/fpg/v1/withdrawals/[id]
 *
 *   GET    Get a single withdrawal by id (withdrawal_id, fpg_txn_id or apex_correlation_id).
 *   PATCH  FPG-internal: approve, reject, mark processing/completed.
 *
 *   PATCH body: { decision: "approve" | "reject" | "processing" | "complete" | "fail",
 *                 reason?: string }
 *
 * Scopes: read (GET), payments.initiate (PATCH).
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
import type { WebhookEventType, Withdrawal, WithdrawalStatus } from "@/server/types";

function present(w: Withdrawal) {
  return {
    withdrawal_id: w.id,
    fpg_txn_id: w.fpgTxnId,
    client_apex_id: w.clientApexId,
    client_fpg_id: w.clientFpgId,
    account_login: w.accountLogin,
    amount: w.amount,
    currency: w.currency,
    method: w.method,
    destination_masked: w.destinationMasked,
    status: w.status,
    rejection_reason: w.rejectionReason,
    apex_correlation_id: w.apexCorrelationId,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/withdrawals/:id", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const w = db.withdrawals.find(
        (x) => x.id === id || x.fpgTxnId === id || x.apexCorrelationId === id
      );
      if (!w) return fpgError(404, "fpg.withdrawal_not_found", `No withdrawal with id=${id}`, ctx);
      return signAndSend({ withdrawal: present(w) }, ctx);
    }
  );
}

const Patch = z.object({
  decision: z.enum(["approve", "reject", "processing", "complete", "fail"]),
  reason: z.string().optional(),
});

const TRANSITION_MAP: Record<
  string,
  { next: WithdrawalStatus; event: WebhookEventType }
> = {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/withdrawals/:id", scopes: ["payments.initiate"] },
    async ({ ctx, body, finalize }) => {
      const { id } = await params;
      const parsed = Patch.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const { decision, reason } = parsed.data;
      const transition = TRANSITION_MAP[decision];
      const db = await getDb();
      const w = db.withdrawals.find(
        (x) => x.id === id || x.fpgTxnId === id || x.apexCorrelationId === id
      );
      if (!w) return fpgError(404, "fpg.withdrawal_not_found", `No withdrawal with id=${id}`, ctx);
      const allowed = ALLOWED_FROM[w.status];
      if (!allowed.includes(transition.next)) {
        return fpgError(
          422,
          "fpg.withdrawal_invalid_transition",
          `Cannot transition withdrawal from ${w.status} to ${transition.next}`,
          ctx,
          { details: { current: w.status, allowed } }
        );
      }
      await tx(async (d) => {
        const target = d.withdrawals.find((x) => x.id === w.id);
        if (!target) return;
        target.status = transition.next;
        target.updatedAt = nowIso();
        if (decision === "reject" || decision === "fail") {
          target.rejectionReason = reason;
        }
      });
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: `PATCH /v1/withdrawals/:id (${decision})`,
        target: `${w.id} · ${transition.next}${reason ? ` (${reason})` : ""}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      await dispatchEvent(
        transition.event,
        {
          withdrawal_id: w.id,
          fpg_txn_id: w.fpgTxnId,
          client_apex_id: w.clientApexId,
          client_fpg_id: w.clientFpgId,
          reason,
        },
        { clientApexId: w.clientApexId, clientFpgId: w.clientFpgId }
      );
      const resp = { withdrawal_id: w.id, status: transition.next, updated_at: nowIso() };
      await finalize({ body: resp, status: 200 });
      return signAndSend(resp, ctx);
    }
  );
}
