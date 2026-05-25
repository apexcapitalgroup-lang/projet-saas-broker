/**
 * /api/fpg/v1/clients/[id]/trades
 *
 * GET — Closed trades for a client over a period.
 *
 *   Query: from=ISO, to=ISO, symbol=…, account_login=…, page, page_size
 *   Scope: read
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
  symbol: z.string().optional(),
  account_login: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(500).default(100),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/trades", scopes: ["read", "reporting"] },
    async ({ ctx }) => {
      const { id } = await params;
      const sp: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((v, k) => (sp[k] = v));
      const parsed = Query.safeParse(sp);
      if (!parsed.success) return fpgError(422, "fpg.validation", "Invalid query", ctx);
      const q = parsed.data;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);

      let rows = db.trades.filter((t) => t.clientApexId === client.apexId);
      if (q.symbol) rows = rows.filter((t) => t.symbol === q.symbol);
      if (q.account_login) rows = rows.filter((t) => t.accountLogin === q.account_login);
      if (q.from) rows = rows.filter((t) => t.closeTime >= q.from!);
      if (q.to) rows = rows.filter((t) => t.closeTime <= q.to!);
      const total = rows.length;
      const start = (q.page - 1) * q.page_size;
      return signAndSend(
        {
          items: rows.slice(start, start + q.page_size).map((t) => ({
            ticket: t.ticket,
            account_login: t.accountLogin,
            symbol: t.symbol,
            side: t.side,
            lots: t.lots,
            open_time: t.openTime,
            close_time: t.closeTime,
            open_price: t.openPrice,
            close_price: t.closePrice,
            commission: t.commission,
            swap: t.swap,
            pnl: t.pnl,
          })),
          page: q.page,
          page_size: q.page_size,
          total,
        },
        ctx
      );
    }
  );
}
