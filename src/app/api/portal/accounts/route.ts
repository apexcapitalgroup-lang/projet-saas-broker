/**
 * GET /api/portal/accounts
 *
 * Lists the trading accounts of the connected client.
 */

import { clientGuard } from "@/server/guards";
import { getDb } from "@/server/store";
import { jsonOk, withErrorHandling } from "@/server/http";

export async function GET() {
  return withErrorHandling(async () => {
    const guard = await clientGuard();
    if (!guard.ok) return guard.res;
    const me = guard.session.user;
    const db = await getDb();
    const accounts = db.tradingAccounts
      .filter((a) => a.clientApexId === me.apexId)
      .map((a) => ({
        login: a.login,
        platform: a.platform,
        mode: a.mode,
        account_type: a.accountType,
        server: a.server,
        currency: a.currency,
        leverage: a.leverage,
        balance: a.balance,
        equity: a.equity,
        margin: a.margin,
        free_margin: a.freeMargin,
        status: a.status,
        opened_at: a.openedAt,
      }));
    return jsonOk({ accounts });
  });
}
