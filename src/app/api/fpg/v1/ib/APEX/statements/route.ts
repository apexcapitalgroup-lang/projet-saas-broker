/**
 * /api/fpg/v1/ib/APEX/statements
 *
 * GET — Monthly IB statements.
 *
 *   Scope: reporting
 */

import { NextRequest } from "next/server";
import { runFpg, signAndSend } from "@/server/fpg/middleware";
import { getDb } from "@/server/store";

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/ib/APEX/statements", scopes: ["reporting"] },
    async ({ ctx }) => {
      const db = await getDb();
      const items = db.statements
        .filter((s) => s.ibCode === "APEX-IB-01")
        .sort((a, b) => b.period.localeCompare(a.period))
        .map((s) => ({
          statement_id: s.id,
          ib_code: s.ibCode,
          period: s.period,
          gross_amount_usd: s.grossAmount,
          adjustments_amount_usd: s.adjustmentsAmount,
          net_payable_usd: s.netPayable,
          lots: s.lots,
          rate_average_usd_per_lot: s.rateAverage,
          generated_at: s.generatedAt,
          due_date: s.dueDate,
          status: s.status,
          paid_at: s.paidAt,
          download_url: `/api/fpg/v1/ib/APEX/statements/${s.id}/download`,
        }));
      return signAndSend({ items, total: items.length }, ctx);
    }
  );
}
