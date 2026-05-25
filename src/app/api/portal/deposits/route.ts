/**
 * POST /api/portal/deposits
 *
 * Initiates a deposit. Internally calls the FPG mock OAuth + sessions endpoints
 * to create a hosted-payment session. Returns the hosted URL.
 *
 * Body: { account_login, amount, currency, method_key }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { newCorrelationId } from "@/lib/ids";
import { audit } from "@/server/audit";
import { clientGuard } from "@/server/guards";
import {
  FPG_DEMO_CLIENT_ID,
  FPG_DEMO_CLIENT_SECRET,
} from "@/server/fpg/credentials";
import { issueToken } from "@/server/fpg/tokens";
import { findAccountByLogin } from "@/server/store";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";

const Body = z.object({
  account_login: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP"]),
  method_key: z.enum([
    "visa_mc",
    "bank_transfer",
    "usdt_trc20",
    "usdt_erc20",
    "skrill",
    "neteller",
  ]),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await clientGuard();
    if (!guard.ok) return guard.res;
    const me = guard.session.user;
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const b = parsed.data;

    const account = await findAccountByLogin(b.account_login);
    if (!account || account.clientApexId !== me.apexId) {
      return jsonError(
        404,
        "account.not_found",
        `Trading account not found or does not belong to you`
      );
    }

    // Issue a short-lived FPG token (scopes: payments.initiate)
    const token = await issueToken(FPG_DEMO_CLIENT_ID, ["payments.initiate"], getClientIp(req));

    // Call our own FPG mock /deposits/sessions endpoint.
    const correlation = newCorrelationId("apex-dep");
    const origin = req.nextUrl.origin;
    const apiResponse = await fetch(`${origin}/api/fpg/v1/deposits/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
        "Idempotency-Key": correlation,
      },
      body: JSON.stringify({
        apex_correlation_id: correlation,
        client_fpg_id: me.fpgId ?? undefined,
        trading_account_login: b.account_login,
        amount: b.amount,
        currency: b.currency,
        method_key: b.method_key,
      }),
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return jsonError(apiResponse.status, "fpg.error", "FPG deposit session failed", {
        details: data,
      });
    }
    await audit({
      actor: `${me.firstName} ${me.lastName}`,
      actorRole: "Client",
      action: "Initiated deposit",
      target: `${me.apexId} · ${b.amount} ${b.currency} via ${b.method_key}`,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      result: "success",
    });
    return jsonOk({
      deposit_id: data.deposit.deposit_id,
      hosted_url: data.deposit.hosted_url,
      status: data.deposit.status,
      apex_correlation_id: correlation,
    });
  });
}
