/**
 * /api/fpg/v1/trading-accounts/[login]/summary
 *
 * GET — Real-time balance, equity, margin and open PnL. Mirror of MT4/MT5.
 *
 * Scope: read
 */

import { NextRequest } from "next/server";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { getDb } from "@/server/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/trading-accounts/:login/summary", scopes: ["read"] },
    async ({ ctx }) => {
      const { login } = await params;
      const db = await getDb();
      const a = db.tradingAccounts.find((x) => x.login === login);
      if (!a) {
        return fpgError(
          404,
          "fpg.account_not_found",
          `No trading account with login=${login}`,
          ctx
        );
      }
      const openPositions = db.openPositions.filter((p) => p.accountLogin === login);
      const openPnl = openPositions.reduce((acc, p) => acc + p.pnl, 0);
      return signAndSend(
        {
          login: a.login,
          client_apex_id: a.clientApexId,
          client_fpg_id: a.clientFpgId,
          platform: a.platform,
          mode: a.mode,
          server: a.server,
          currency: a.currency,
          leverage: a.leverage,
          balance: a.balance,
          equity: a.equity,
          margin: a.margin,
          free_margin: a.freeMargin,
          margin_level_pct: a.margin > 0 ? (a.equity / a.margin) * 100 : null,
          open_pnl: openPnl,
          open_positions: openPositions.length,
          status: a.status,
          opened_at: a.openedAt,
        },
        ctx
      );
    }
  );
}
