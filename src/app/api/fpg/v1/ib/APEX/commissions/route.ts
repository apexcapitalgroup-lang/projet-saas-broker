/**
 * /api/fpg/v1/ib/APEX/commissions
 *
 * GET — Per-day commission entries including adjustments (scalping, excluded clients,
 *       chargebacks, rebates). The exact formula is documented in /docs/fpg-api-spec.
 *
 *   Query: from=YYYY-MM-DD, to=YYYY-MM-DD, type=…
 *   Scope: reporting
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { getDb } from "@/server/store";

const Query = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(["trade", "scalping_excluded", "client_excluded", "chargeback", "rebate"]).optional(),
});

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/ib/APEX/commissions", scopes: ["reporting"] },
    async ({ ctx }) => {
      const sp: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((v, k) => (sp[k] = v));
      const parsed = Query.safeParse(sp);
      if (!parsed.success) return fpgError(422, "fpg.validation", "Invalid query", ctx);
      const q = parsed.data;
      const db = await getDb();
      let rows = db.commissions.slice();
      if (q.from) rows = rows.filter((r) => r.date >= q.from!);
      if (q.to) rows = rows.filter((r) => r.date <= q.to!);
      if (q.type) rows = rows.filter((r) => r.type === q.type);

      const gross = rows.filter((r) => r.type === "trade").reduce((acc, r) => acc + r.amount, 0);
      const adjustments = rows.filter((r) => r.type !== "trade").reduce((acc, r) => acc + r.amount, 0);
      return signAndSend(
        {
          period: { from: q.from ?? null, to: q.to ?? null },
          items: rows.map((r) => ({
            id: r.id,
            date: r.date,
            ib_code: r.ibCode,
            client_apex_id: r.clientApexId,
            account_login: r.accountLogin,
            symbol: r.symbol,
            lots: r.lots,
            rate_usd_per_lot: r.rateUsdPerLot,
            amount_usd: r.amount,
            type: r.type,
            reason: r.reason,
          })),
          totals: {
            gross_usd: Math.round(gross * 100) / 100,
            adjustments_usd: Math.round(adjustments * 100) / 100,
            net_payable_usd: Math.round((gross + adjustments) * 100) / 100,
            entries: rows.length,
          },
        },
        ctx
      );
    }
  );
}
