/**
 * /api/fpg/v1/deposits/sessions
 *
 * POST — Create a hosted-payment session. APEX never sees the card data.
 *        Returns a hosted_url that the client browser is redirected to.
 *        The PSP page is the FPG-side responsibility (here mocked at /fpg-psp-mock).
 *
 *   Idempotency-Key: required.
 *   Scope: payments.initiate
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { newCorrelationId, newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type { DepositMethod, DepositSession, Psp } from "@/server/types";

const Body = z.object({
  apex_correlation_id: z.string().optional(),
  client_fpg_id: z.string().regex(/^FPG-\d+$/).optional(),
  trading_account_login: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CHF", "AUD"]),
  method_key: z.enum([
    "visa_mc",
    "bank_transfer",
    "usdt_trc20",
    "usdt_erc20",
    "skrill",
    "neteller",
  ]),
  return_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
});

const METHOD_MAP: Record<string, { name: DepositMethod; psp: Psp; feePct: number }> = {
  visa_mc: { name: "Visa / Mastercard", psp: "Apex-PSP-FPG", feePct: 0.015 },
  bank_transfer: { name: "Bank transfer", psp: "FPG-Bank-Rails", feePct: 0 },
  usdt_trc20: { name: "USDT (TRC20)", psp: "FPG-Crypto-Gateway", feePct: 0.005 },
  usdt_erc20: { name: "USDT (ERC20)", psp: "FPG-Crypto-Gateway", feePct: 0.005 },
  skrill: { name: "Skrill", psp: "Apex-PSP-FPG", feePct: 0.02 },
  neteller: { name: "Neteller", psp: "Apex-PSP-FPG", feePct: 0.02 },
};

function present(d: DepositSession) {
  return {
    deposit_id: d.id,
    fpg_txn_id: d.fpgTxnId,
    client_apex_id: d.clientApexId,
    client_fpg_id: d.clientFpgId,
    account_login: d.accountLogin,
    amount: d.amount,
    currency: d.currency,
    method: d.method,
    psp: d.psp,
    fees: d.fees,
    status: d.status,
    hosted_url: d.hostedUrl,
    apex_correlation_id: d.apexCorrelationId,
    created_at: d.createdAt,
    completed_at: d.completedAt,
    failed_at: d.failedAt,
    failure_reason: d.failureReason,
  };
}

export async function POST(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/deposits/sessions", scopes: ["payments.initiate"] },
    async ({ ctx, body, finalize }) => {
      const parsed = Body.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const b = parsed.data;
      const db = await getDb();
      const account = db.tradingAccounts.find((a) => a.login === b.trading_account_login);
      if (!account) {
        return fpgError(
          404,
          "fpg.account_not_found",
          `No trading account with login=${b.trading_account_login}`,
          ctx
        );
      }
      if (account.status !== "active") {
        return fpgError(
          422,
          "fpg.account_not_active",
          `Account ${account.login} is not active (status=${account.status})`,
          ctx
        );
      }
      const client = db.clients.find((c) => c.apexId === account.clientApexId);
      if (!client) {
        return fpgError(500, "fpg.account.orphan", "Account has no parent client", ctx);
      }
      // Hosted-payment limits
      if (b.amount < 50) {
        return fpgError(422, "fpg.amount_below_min", "Minimum deposit is 50", ctx);
      }
      const methodMeta = METHOD_MAP[b.method_key];
      const fees = b.amount * methodMeta.feePct;
      const fpgTxnId = `FPG-DEP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const apexCorrelationId =
        b.apex_correlation_id ?? newCorrelationId("apex-dep");

      const deposit: DepositSession = {
        id: newId("dp"),
        fpgTxnId,
        clientApexId: client.apexId,
        clientFpgId: client.fpgId ?? "FPG-0000000",
        accountLogin: account.login,
        amount: b.amount,
        currency: b.currency,
        method: methodMeta.name,
        psp: methodMeta.psp,
        hostedUrl: "",
        status: "initiated",
        fees,
        apexCorrelationId,
        createdAt: nowIso(),
      };
      deposit.hostedUrl = `/fpg-psp-mock/${deposit.id}`;

      await tx(async (d) => {
        d.deposits.unshift(deposit);
      });

      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/deposits/sessions",
        target: `${client.apexId} · ${b.amount} ${b.currency} via ${methodMeta.name}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });

      await dispatchEvent(
        "deposit_created",
        {
          deposit_id: deposit.id,
          fpg_txn_id: fpgTxnId,
          client_apex_id: client.apexId,
          client_fpg_id: client.fpgId,
          amount: b.amount,
          currency: b.currency,
          method: methodMeta.name,
        },
        { clientApexId: client.apexId, clientFpgId: client.fpgId ?? undefined }
      );

      const resp = {
        deposit: present(deposit),
        // Stripe-style "next_action" → the front-end uses this to redirect.
        next_action: {
          type: "redirect_to_hosted_url",
          url: deposit.hostedUrl,
        },
      };
      await finalize({ body: resp, status: 201 });
      return signAndSend(resp, ctx, { status: 201 });
    }
  );
}
