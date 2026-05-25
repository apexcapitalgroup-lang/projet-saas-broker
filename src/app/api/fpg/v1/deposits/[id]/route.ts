/**
 * /api/fpg/v1/deposits/[id]
 *
 * GET — Retrieve deposit status by id (deposit_id or fpg_txn_id or apex_correlation_id).
 *
 * Scope: read
 */

import { NextRequest } from "next/server";
import { fpgError, runFpg, signAndSend } from "@/server/fpg/middleware";
import { getDb } from "@/server/store";
import type { DepositSession } from "@/server/types";

function present(d: DepositSession) {
  return {
    deposit_id: d.id,
    fpg_txn_id: d.fpgTxnId,
    client_apex_id: d.clientApexId,
    client_fpg_id: d.clientFpgId,
    account_login: d.accountLogin,
    amount: d.amount,
    currency: d.currency,
    method: d.method,
    psp: d.psp,
    fees: d.fees,
    status: d.status,
    hosted_url: d.hostedUrl,
    apex_correlation_id: d.apexCorrelationId,
    created_at: d.createdAt,
    completed_at: d.completedAt,
    failed_at: d.failedAt,
    failure_reason: d.failureReason,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/deposits/:id", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const d = db.deposits.find(
        (x) => x.id === id || x.fpgTxnId === id || x.apexCorrelationId === id
      );
      if (!d) {
        return fpgError(404, "fpg.deposit_not_found", `No deposit with id=${id}`, ctx);
      }
      return signAndSend({ deposit: present(d) }, ctx);
    }
  );
}
