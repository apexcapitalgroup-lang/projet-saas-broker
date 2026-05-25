/**
 * /api/fpg/v1/ib/APEX/volumes
 *
 * GET — Aggregate trading volumes for the APEX partner.
 *
 *   Query: from=YYYY-MM-DD, to=YYYY-MM-DD, group_by=day|symbol|client|account,
 *          client_id=, symbol=
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
  group_by: z.enum(["day", "symbol", "client", "account"]).default("day"),
  client_id: z.string().optional(),
  symbol: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/ib/APEX/volumes", scopes: ["reporting"] },
    async ({ ctx }) => {
      const sp: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((v, k) => (sp[k] = v));
      const parsed = Query.safeParse(sp);
      if (!parsed.success) return fpgError(422, "fpg.validation", "Invalid query", ctx);
      const q = parsed.data;
      const db = await getDb();
      let rows = db.ibVolumes.slice();
      if (q.from) rows = rows.filter((r) => r.date >= q.from!);
      if (q.to) rows = rows.filter((r) => r.date <= q.to!);
      if (q.symbol) rows = rows.filter((r) => r.symbol === q.symbol);
      if (q.client_id) rows = rows.filter((r) => r.clientApexId === q.client_id);

      // Group
      const buckets = new Map<string, { lots: number; notional: number; trades: number }>();
      const keyFor = (r: typeof rows[number]) => {
        switch (q.group_by) {
          case "day":
            return r.date;
          case "symbol":
            return r.symbol;
          case "client":
            return r.clientApexId;
          case "account":
            return r.accountLogin;
        }
      };
      for (const r of rows) {
        const k = keyFor(r);
        const b = buckets.get(k) ?? { lots: 0, notional: 0, trades: 0 };
        b.lots += r.lots;
        b.notional += r.notional;
        b.trades += r.trades;
        buckets.set(k, b);
      }
      const items = Array.from(buckets.entries()).map(([key, v]) => ({
        [q.group_by]: key,
        lots: Number(v.lots.toFixed(2)),
        notional_usd: Math.round(v.notional),
        trades: v.trades,
      }));
      // Totals
      const total_lots = items.reduce((acc, x) => acc + x.lots, 0);
      const total_notional = items.reduce((acc, x) => acc + x.notional_usd, 0);
      return signAndSend(
        {
          group_by: q.group_by,
          period: { from: q.from ?? null, to: q.to ?? null },
          items: items.sort((a, b) => String(a[q.group_by]).localeCompare(String(b[q.group_by]))),
          totals: {
            lots: Number(total_lots.toFixed(2)),
            notional_usd: total_notional,
          },
        },
        ctx
      );
    }
  );
}
