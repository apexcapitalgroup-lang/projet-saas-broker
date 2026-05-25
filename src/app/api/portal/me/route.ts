/**
 * GET /api/portal/me
 *
 * Returns the connected client's profile + summary metrics.
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
    const accounts = db.tradingAccounts.filter((a) => a.clientApexId === me.apexId);
    const deposits = db.deposits.filter((d) => d.clientApexId === me.apexId);
    const withdrawals = db.withdrawals.filter((w) => w.clientApexId === me.apexId);
    return jsonOk({
      profile: {
        apex_id: me.apexId,
        fpg_id: me.fpgId,
        first_name: me.firstName,
        last_name: me.lastName,
        email: me.email,
        phone: me.phone,
        country: me.countryOfResidence,
        type: me.type,
        status: me.status,
        kyc: me.kyc,
        ib_code: me.ibCode,
        registered_at: me.createdAt,
      },
      metrics: {
        accounts_count: accounts.length,
        total_balance_usd: accounts.reduce((acc, a) => acc + a.balance, 0),
        total_equity_usd: accounts.reduce((acc, a) => acc + a.equity, 0),
        lifetime_deposits_usd: deposits
          .filter((d) => d.status === "completed")
          .reduce((acc, d) => acc + d.amount, 0),
        lifetime_withdrawals_usd: withdrawals
          .filter((w) => w.status === "completed")
          .reduce((acc, w) => acc + w.amount, 0),
        net_deposit_usd: me.netDeposit,
        volume_30d_usd: me.volume30d,
      },
    });
  });
}
