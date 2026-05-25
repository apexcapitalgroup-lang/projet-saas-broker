/**
 * /api/fpg/v1/clients/[id]/trading-accounts
 *
 *   POST  Create a new MT4/MT5 account on FPG infrastructure.
 *   GET   List all trading accounts for the client.
 *
 * Scopes: accounts.create (POST), read (GET).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  fpgError,
  runFpg,
  signAndSend,
} from "@/server/fpg/middleware";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { tx, getDb } from "@/server/store";
import { dispatchEvent } from "@/server/webhooks/dispatcher";
import type {
  AccountType,
  Currency,
  FpgServer,
  Platform,
  TradingAccount,
} from "@/server/types";

const CreateBody = z.object({
  platform: z.enum(["MT4", "MT5"]),
  mode: z.enum(["Live", "Demo"]).default("Live"),
  account_type: z.enum(["Standard", "Pro", "Raw", "ECN", "Islamic"]),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CHF", "AUD"]),
  leverage: z.number().int().positive().max(500).default(100),
});

function chooseServer(client: { countryOfResidence: string }, mode: "Live" | "Demo"): FpgServer {
  if (mode === "Demo") return "FPG-Demo-01";
  const apacish = /^(Japan|Korea|Singapore|Hong Kong|China|Australia|Indonesia|Thailand|Malaysia|Philippines)$/i;
  if (apacish.test(client.countryOfResidence)) return "FPG-Live-03";
  // Round robin between 01 / 02 for everyone else (deterministic by id)
  return Math.random() < 0.5 ? "FPG-Live-01" : "FPG-Live-02";
}

function buildLogin(fpgId: string, mode: "Live" | "Demo", existingCount: number): string {
  const suffix = mode === "Live" ? "L" : "D";
  return `${fpgId.replace("FPG-", "FPG")}-${suffix}${existingCount + 1}`;
}

function present(a: TradingAccount) {
  return {
    account_id: a.id,
    login: a.login,
    client_fpg_id: a.clientFpgId,
    client_apex_id: a.clientApexId,
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
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    {
      endpoint: "/v1/clients/:id/trading-accounts",
      scopes: ["accounts.create"],
    },
    async ({ ctx, body, finalize }) => {
      const { id } = await params;
      const parsed = CreateBody.safeParse(body);
      if (!parsed.success) {
        return fpgError(422, "fpg.validation", "Body validation failed", ctx, {
          details: parsed.error.issues,
        });
      }
      const b = parsed.data;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      if (!client.fpgId) {
        return fpgError(
          422,
          "fpg.client_not_provisioned",
          "Client has no fpg_client_id yet — create the client first via POST /v1/clients",
          ctx
        );
      }
      if (b.mode === "Live" && client.kyc !== "approved" && client.kyc !== "enhanced_due_diligence") {
        return fpgError(
          403,
          "fpg.kyc_not_approved",
          "Live account creation requires an approved KYC",
          ctx,
          { details: { current_kyc_status: client.kyc } }
        );
      }
      const existing = db.tradingAccounts.filter((a) => a.clientApexId === client.apexId);
      if (existing.length >= 5) {
        return fpgError(429, "fpg.account_limit_reached", "Client has reached the maximum of 5 trading accounts", ctx);
      }

      const fpgServer = chooseServer(client, b.mode);
      const login = buildLogin(client.fpgId, b.mode, existing.length);
      const account: TradingAccount = {
        id: newId("ta"),
        login,
        clientApexId: client.apexId,
        clientFpgId: client.fpgId,
        platform: b.platform as Platform,
        mode: b.mode,
        accountType: b.account_type as AccountType,
        server: fpgServer,
        currency: b.currency as Currency,
        leverage: b.leverage,
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        status: "active",
        openedAt: nowIso(),
      };

      await tx(async (d) => {
        d.tradingAccounts.push(account);
        const c = d.clients.find((x) => x.id === client.id);
        if (c) {
          c.accountsCount = (c.accountsCount ?? 0) + 1;
          c.updatedAt = nowIso();
        }
      });

      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/clients/:id/trading-accounts",
        target: `${client.apexId} · ${login} (${b.platform} ${b.account_type})`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });

      await dispatchEvent(
        "trading_account_created",
        {
          login,
          client_apex_id: client.apexId,
          client_fpg_id: client.fpgId,
          platform: b.platform,
          mode: b.mode,
          account_type: b.account_type,
          currency: b.currency,
          leverage: b.leverage,
          server: fpgServer,
        },
        { clientApexId: client.apexId, clientFpgId: client.fpgId }
      );

      const resp = {
        account: present(account),
        password_reset_url: `/api/fpg/v1/trading-accounts/${login}/password-reset`,
        // The actual MT4/MT5 password is never returned. Client uses the
        // password_reset flow on first login.
      };
      await finalize({ body: resp, status: 201 });
      return signAndSend(resp, ctx, { status: 201 });
    }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/clients/:id/trading-accounts", scopes: ["read"] },
    async ({ ctx }) => {
      const { id } = await params;
      const db = await getDb();
      const client = db.clients.find((c) => c.fpgId === id || c.apexId === id);
      if (!client) {
        return fpgError(404, "fpg.client_not_found", `No client with id=${id}`, ctx);
      }
      const accounts = db.tradingAccounts
        .filter((a) => a.clientApexId === client.apexId)
        .map(present);
      return signAndSend({ accounts }, ctx);
    }
  );
}
