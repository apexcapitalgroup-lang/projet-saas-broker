/**
 * POST /api/portal/withdrawals
 *
 * Initiates a withdrawal request via the FPG mock layer.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { newCorrelationId } from "@/lib/ids";
import { audit } from "@/server/audit";
import { clientGuard } from "@/server/guards";
import {
  FPG_DEMO_CLIENT_ID,
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
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CHF", "AUD"]),
  method: z.enum([
    "bank_transfer_swift",
    "bank_transfer_sepa",
    "visa_mc_refund",
    "skrill",
    "neteller",
    "usdt_trc20",
    "usdt_erc20",
  ]),
  destination_masked: z.string().min(1),
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
      return jsonError(404, "account.not_found", "Account not found or not yours");
    }

    const token = await issueToken(FPG_DEMO_CLIENT_ID, ["payments.initiate"], getClientIp(req));
    const correlation = newCorrelationId("apex-wd");
    const origin = req.nextUrl.origin;
    const apiResponse = await fetch(`${origin}/api/fpg/v1/withdrawals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.accessToken}`,
        "Idempotency-Key": correlation,
      },
      body: JSON.stringify({
        apex_correlation_id: correlation,
        trading_account_login: b.account_login,
        amount: b.amount,
        currency: b.currency,
        method: b.method,
        destination_masked: b.destination_masked,
      }),
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      return jsonError(apiResponse.status, "fpg.error", "FPG withdrawal request failed", {
        details: data,
      });
    }
    await audit({
      actor: `${me.firstName} ${me.lastName}`,
      actorRole: "Client",
      action: "Initiated withdrawal",
      target: `${me.apexId} · ${b.amount} ${b.currency} via ${b.method}`,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      result: "success",
    });
    return jsonOk({
      withdrawal_id: data.withdrawal.withdrawal_id,
      status: data.withdrawal.status,
      apex_correlation_id: correlation,
    });
  });
}
