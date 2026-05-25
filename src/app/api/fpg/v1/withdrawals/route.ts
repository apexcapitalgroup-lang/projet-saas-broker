/**
 * /api/fpg/v1/withdrawals
 *
 *   POST  Create a withdrawal request. AML rules apply.
 *   GET   List withdrawals (paginated, filtered).
 *
 * Scopes: payments.initiate (POST), read (GET).
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
import type { Withdrawal } from "@/server/types";

const Body = z.object({
  apex_correlation_id: z.string().optional(),
  trading_account_login: z.string().min(1),
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

function present(w: Withdrawal) {
  return {
    withdrawal_id: w.id,
    fpg_txn_id: w.fpgTxnId,
    client_apex_id: w.clientApexId,
    client_fpg_id: w.clientFpgId,
    account_login: w.accountLogin,
    amount: w.amount,
    currency: w.currency,
    method: w.method,
    destination_masked: w.destinationMasked,
    status: w.status,
    rejection_reason: w.rejectionReason,
    apex_correlation_id: w.apexCorrelationId,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}

export async function POST(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/withdrawals", scopes: ["payments.initiate"] },
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
      if (b.amount > account.freeMargin) {
        return fpgError(
          422,
          "fpg.insufficient_free_margin",
          `Requested ${b.amount} exceeds free margin ${account.freeMargin.toFixed(2)}`,
          ctx,
          { details: { free_margin: account.freeMargin } }
        );
      }
      const client = db.clients.find((c) => c.apexId === account.clientApexId);
      if (!client) {
        return fpgError(500, "fpg.account.orphan", "Account has no parent client", ctx);
      }
      if (client.kyc !== "approved" && client.kyc !== "enhanced_due_diligence") {
        return fpgError(
          403,
          "fpg.kyc_not_approved",
          "Withdrawals require an approved KYC",
          ctx,
          { details: { kyc_status: client.kyc } }
        );
      }

      // AML rule: same-source — refund to original deposit method up to deposited amount
      // (We allow it through but emit a warning event if exceeded.)
      const refundExceedsDeposited =
        b.method === "visa_mc_refund" &&
        b.amount > db.deposits
          .filter(
            (d) => d.clientApexId === client.apexId && d.method === "Visa / Mastercard" && d.status === "completed"
          )
          .reduce((acc, d) => acc + d.amount, 0);
      if (refundExceedsDeposited) {
        return fpgError(
          422,
          "fpg.aml.method_mismatch",
          "Visa/MC refund cannot exceed the total amount previously deposited via Visa/MC",
          ctx
        );
      }

      const fpgTxnId = `FPG-WD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const wd: Withdrawal = {
        id: newId("wd"),
        fpgTxnId,
        clientApexId: client.apexId,
        clientFpgId: client.fpgId ?? "FPG-0000000",
        accountLogin: account.login,
        method: b.method,
        amount: b.amount,
        currency: b.currency,
        status: "requested",
        apexCorrelationId: b.apex_correlation_id ?? newCorrelationId("apex-wd"),
        destinationMasked: b.destination_masked,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      await tx(async (d) => {
        d.withdrawals.unshift(wd);
      });

      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/withdrawals",
        target: `${client.apexId} · ${b.amount} ${b.currency} via ${b.method}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });

      await dispatchEvent(
        "withdrawal_requested",
        {
          withdrawal_id: wd.id,
          fpg_txn_id: fpgTxnId,
          client_apex_id: client.apexId,
          client_fpg_id: client.fpgId,
          amount: b.amount,
          currency: b.currency,
          method: b.method,
        },
        { clientApexId: client.apexId, clientFpgId: client.fpgId ?? undefined }
      );
      // Auto-transition to under_review after a few hundred ms
      await dispatchEvent(
        "withdrawal_under_review",
        { withdrawal_id: wd.id, reason: "Automated AML checks complete, awaiting compliance review" },
        { clientApexId: client.apexId, clientFpgId: client.fpgId ?? undefined, delayMs: 1500 }
      );

      const resp = { withdrawal: present(wd) };
      await finalize({ body: resp, status: 201 });
      return signAndSend(resp, ctx, { status: 201 });
    }
  );
}

const ListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
  status: z.string().optional(),
  client_id: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/withdrawals", scopes: ["read"] },
    async ({ ctx }) => {
      const params: Record<string, string> = {};
      req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
      const parsed = ListQuery.safeParse(params);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Invalid query", ctx, {
          details: parsed.error.issues,
        });
      }
      const q = parsed.data;
      const db = await getDb();
      let rows = db.withdrawals.slice();
      if (q.status) rows = rows.filter((w) => w.status === q.status);
      if (q.client_id)
        rows = rows.filter(
          (w) => w.clientApexId === q.client_id || w.clientFpgId === q.client_id
        );
      if (q.from) rows = rows.filter((w) => w.createdAt >= q.from!);
      if (q.to) rows = rows.filter((w) => w.createdAt <= q.to!);
      const total = rows.length;
      const start = (q.page - 1) * q.page_size;
      return signAndSend(
        {
          items: rows.slice(start, start + q.page_size).map(present),
          page: q.page,
          page_size: q.page_size,
          total,
        },
        ctx
      );
    }
  );
}
