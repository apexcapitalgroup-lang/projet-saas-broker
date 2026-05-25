/**
 * GET /api/portal/transactions
 *
 * Combined deposits + withdrawals history for the logged-in client.
 */

import { NextRequest } from "next/server";
import { clientGuard } from "@/server/guards";
import { getDb } from "@/server/store";
import { jsonOk, withErrorHandling } from "@/server/http";

export async function GET(_req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await clientGuard();
    if (!guard.ok) return guard.res;
    const me = guard.session.user;
    const db = await getDb();
    const dep = db.deposits.filter((d) => d.clientApexId === me.apexId);
    const wd = db.withdrawals.filter((w) => w.clientApexId === me.apexId);
    const items = [
      ...dep.map((d) => ({
        kind: "deposit" as const,
        id: d.id,
        ref: d.fpgTxnId,
        date: d.createdAt,
        method: d.method,
        account: d.accountLogin,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
      })),
      ...wd.map((w) => ({
        kind: "withdrawal" as const,
        id: w.id,
        ref: w.fpgTxnId ?? "—",
        date: w.createdAt,
        method: w.method,
        account: w.accountLogin,
        amount: w.amount,
        currency: w.currency,
        status: w.status,
      })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return jsonOk({ items });
  });
}
