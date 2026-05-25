/**
 * /api/fpg/v1/ib/APEX/reconciliation
 *
 * GET — Daily reconciliation rows comparing APEX-recorded values vs FPG canonical
 *       (deposits, withdrawals, volume in lots). Any non-zero delta is flagged.
 *
 *   Query: from=YYYY-MM-DD, to=YYYY-MM-DD
 *   Scope: reporting
 */

import { NextRequest } from "next/server";
import { runFpg, signAndSend } from "@/server/fpg/middleware";
import { getDb } from "@/server/store";

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/ib/APEX/reconciliation", scopes: ["reporting"] },
    async ({ ctx }) => {
      const { searchParams } = req.nextUrl;
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const db = await getDb();
      let rows = db.reconciliation.slice();
      if (from) rows = rows.filter((r) => r.date >= from);
      if (to) rows = rows.filter((r) => r.date <= to);
      const items = rows.map((r) => ({
        date: r.date,
        fpg_deposits_usd: r.fpgDeposits,
        apex_deposits_usd: r.apexDeposits,
        fpg_withdrawals_usd: r.fpgWithdrawals,
        apex_withdrawals_usd: r.apexWithdrawals,
        fpg_volume_lots: r.fpgVolumeLots,
        apex_volume_lots: r.apexVolumeLots,
        delta_usd: r.delta,
        status: r.status,
        note: r.note,
      }));
      const open_deltas = items.filter((i) => i.status === "delta").length;
      return signAndSend({ items, open_deltas }, ctx);
    }
  );
}
