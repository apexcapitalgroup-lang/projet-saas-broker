/**
 * /api/fpg/v1/trading-accounts/[login]/password-reset
 *
 * POST — Initiate a secure password reset. FPG sends an ephemeral one-time
 *        link to the client's email; APEX never sees the password in clear.
 *
 * Scope: accounts.create
 */

import { NextRequest } from "next/server";
import { audit } from "@/server/audit";
import { fpgError, runFpg, signAndSend } from "@/server/fpg/middleware";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  return runFpg(
    req,
    {
      endpoint: "/v1/trading-accounts/:login/password-reset",
      scopes: ["accounts.create"],
    },
    async ({ ctx, finalize }) => {
      const { login } = await params;
      const db = await getDb();
      const a = db.tradingAccounts.find((x) => x.login === login);
      if (!a) {
        return fpgError(404, "fpg.account_not_found", `No trading account with login=${login}`, ctx);
      }
      const ticket = newId("pwreset");
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/trading-accounts/:login/password-reset",
        target: login,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      await dispatchEvent(
        "password_reset_requested",
        { login, ticket, expires_at: expiresAt },
        { clientApexId: a.clientApexId, clientFpgId: a.clientFpgId }
      );
      const resp = {
        login,
        ticket,
        expires_at: expiresAt,
        // FPG would email a one-time URL like https://fpg-id.com/reset?ticket=…
        // We expose it here for the demo so the loop is visible.
        reset_url: `https://fpg-id.com/reset?ticket=${ticket}`,
        delivered_via: "email",
        sent_at: nowIso(),
      };
      await finalize({ body: resp, status: 200 });
      return signAndSend(resp, ctx);
    }
  );
}
