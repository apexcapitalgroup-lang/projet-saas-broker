/**
 * /api/fpg/v1/trading-accounts/[login]/leverage
 *
 * PATCH — Change leverage. Subject to FPG compliance limits per jurisdiction.
 *
 * Scope: accounts.create
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";

const Body = z.object({
  leverage: z.number().int().positive().max(500),
});

// Jurisdiction-aware leverage caps
const MAX_LEVERAGE_BY_RESIDENCE: Record<string, number> = {
  "United States": 50,
  USA: 50,
  France: 30,
  Germany: 30,
  Italy: 30,
  Spain: 30,
  UK: 30,
  Australia: 30,
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  return runFpg(
    req,
    {
      endpoint: "/v1/trading-accounts/:login/leverage",
      scopes: ["accounts.create"],
    },
    async ({ ctx, body, finalize }) => {
      const { login } = await params;
      const parsed = Body.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const { leverage } = parsed.data;
      const db = await getDb();
      const account = db.tradingAccounts.find((a) => a.login === login);
      if (!account) {
        return fpgError(404, "fpg.account_not_found", `No trading account with login=${login}`, ctx);
      }
      const client = db.clients.find((c) => c.apexId === account.clientApexId);
      const cap = client ? MAX_LEVERAGE_BY_RESIDENCE[client.countryOfResidence] : undefined;
      if (cap && leverage > cap) {
        return fpgError(
          422,
          "fpg.leverage_above_jurisdiction_cap",
          `Leverage capped at ${cap}:1 for residents of ${client?.countryOfResidence}`,
          ctx,
          { details: { requested: leverage, max: cap } }
        );
      }
      const before = account.leverage;
      await tx(async (d) => {
        const a = d.tradingAccounts.find((x) => x.login === login);
        if (a) a.leverage = leverage;
      });
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "PATCH /v1/trading-accounts/:login/leverage",
        target: `${login}: ${before} → ${leverage}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      await dispatchEvent(
        "leverage_changed",
        {
          login,
          client_apex_id: account.clientApexId,
          client_fpg_id: account.clientFpgId,
          from: before,
          to: leverage,
        },
        { clientApexId: account.clientApexId, clientFpgId: account.clientFpgId }
      );
      const resp = { login, leverage, updated_at: nowIso() };
      await finalize({ body: resp, status: 200 });
      return signAndSend(resp, ctx);
    }
  );
}
