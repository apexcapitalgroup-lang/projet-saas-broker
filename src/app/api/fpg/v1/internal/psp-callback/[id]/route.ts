/**
 * /api/fpg/v1/internal/psp-callback/[id]
 *
 * Internal endpoint called by the fake PSP page (/fpg-psp-mock/[id]) to mark
 * a deposit session as completed or failed. In a real implementation this would
 * be the PSP's server-to-server callback to FPG.
 *
 * No auth scopes — relies on same-origin + short-lived deposit id.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { nowIso } from "@/lib/now";
import { tx, findDeposit } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";

const Body = z.object({
  outcome: z.enum(["success", "fail", "chargeback"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const deposit = await findDeposit(id);
    if (!deposit) {
      return jsonError(404, "psp.deposit_not_found", `No deposit with id=${id}`);
    }
    if (deposit.status === "completed" || deposit.status === "failed") {
      return jsonOk({
        deposit_id: deposit.id,
        status: deposit.status,
        replay: true,
      });
    }
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (parsed.data.outcome === "success") {
      await tx(async (d) => {
        const dep = d.deposits.find((x) => x.id === id);
        if (!dep) return;
        dep.status = "completed";
        dep.completedAt = nowIso();
      });
      await audit({
        actor: "PSP callback",
        actorRole: "External",
        action: "psp.deposit_success",
        target: deposit.id,
        ip,
        userAgent,
        result: "success",
      });
      await dispatchEvent(
        "deposit_completed",
        {
          deposit_id: deposit.id,
          fpg_txn_id: deposit.fpgTxnId,
          client_apex_id: deposit.clientApexId,
          client_fpg_id: deposit.clientFpgId,
          account_login: deposit.accountLogin,
          amount: deposit.amount,
          currency: deposit.currency,
          method: deposit.method,
        },
        { clientApexId: deposit.clientApexId, clientFpgId: deposit.clientFpgId, delayMs: 200 }
      );
    } else if (parsed.data.outcome === "fail") {
      const reason = parsed.data.reason ?? "PSP declined the payment";
      await tx(async (d) => {
        const dep = d.deposits.find((x) => x.id === id);
        if (!dep) return;
        dep.status = "failed";
        dep.failedAt = nowIso();
        dep.failureReason = reason;
      });
      await audit({
        actor: "PSP callback",
        actorRole: "External",
        action: "psp.deposit_failed",
        target: `${deposit.id} · ${reason}`,
        ip,
        userAgent,
        result: "failure",
      });
      await dispatchEvent(
        "deposit_failed",
        {
          deposit_id: deposit.id,
          fpg_txn_id: deposit.fpgTxnId,
          client_apex_id: deposit.clientApexId,
          client_fpg_id: deposit.clientFpgId,
          reason,
        },
        { clientApexId: deposit.clientApexId, clientFpgId: deposit.clientFpgId, delayMs: 200 }
      );
    } else {
      // chargeback
      await tx(async (d) => {
        const dep = d.deposits.find((x) => x.id === id);
        if (!dep) return;
        dep.status = "chargeback";
      });
      await dispatchEvent(
        "deposit_chargeback",
        {
          deposit_id: deposit.id,
          fpg_txn_id: deposit.fpgTxnId,
          client_apex_id: deposit.clientApexId,
          amount: deposit.amount,
        },
        { clientApexId: deposit.clientApexId, delayMs: 200 }
      );
    }
    return jsonOk({ deposit_id: id, status: parsed.data.outcome });
  });
}
