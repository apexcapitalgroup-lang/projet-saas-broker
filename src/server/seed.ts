/**
 * Deterministic seed data for the APEX × FPG demo.
 *
 * Sources:
 *   - The hand-crafted entities defined in src/lib/mock.ts (kept for visual continuity).
 *   - Generated data for scale (additional clients, trades, IB volumes, webhook history).
 *
 * Reproducibility: seeded by a Mulberry32 PRNG. Same seed → same data.
 */

import {
  CLIENTS as MOCK_CLIENTS,
  TRADING_ACCOUNTS as MOCK_ACCOUNTS,
  DEPOSITS as MOCK_DEPOSITS,
  WITHDRAWALS as MOCK_WITHDRAWALS,
  WEBHOOKS as MOCK_WEBHOOKS,
  AUDIT_LOG as MOCK_AUDIT,
  API_KEYS as MOCK_APIKEYS,
  TEAM as MOCK_TEAM,
  RECONCILIATION as MOCK_RECON,
} from "@/lib/mock";
import { Prng } from "./prng";
import { hashPassword, generateTotpSecret, sha256 } from "./crypto";
import { bumpCountersFromSeed, newApexId, newFpgClientId } from "@/lib/ids";
import { NOW, nowIso } from "@/lib/now";
import type {
  ApiKey,
  AuditEntry,
  Client,
  CommissionEntry,
  DatabaseShape,
  DepositMethod,
  DepositSession,
  IbVolumeRow,
  KycDocument,
  MonthlyStatement,
  OpenPosition,
  ReconciliationRow,
  ServerConfig,
  Session,
  TeamMember,
  Trade,
  TradingAccount,
  WebhookEvent,
  Withdrawal,
} from "./types";

const DEMO_PASSWORD = "ApexDemo!2026";
const DEMO_CLIENT_PASSWORD = "TraderDemo!2026";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function daysAgo(n: number, hourOffset = 9): string {
  const d = new Date(NOW.getTime() - n * 86_400_000);
  d.setUTCHours(hourOffset, 0, 0, 0);
  return d.toISOString();
}

function minutesAgo(n: number): string {
  return new Date(NOW.getTime() - n * 60_000).toISOString();
}

/* -------------------------------------------------------------------------- */
/*  Seed                                                                       */
/* -------------------------------------------------------------------------- */

export function buildSeed(): DatabaseShape {
  const rng = new Prng(0xa9ec_dead);

  /* ------------------- Clients (hand + generated) ----------------------- */

  const clients: Client[] = MOCK_CLIENTS.map((m) => {
    const [firstName, ...rest] = m.name.split(" ");
    const lastName = rest.join(" ");
    const { hash, salt } = hashPassword(DEMO_CLIENT_PASSWORD);
    return {
      id: m.id,
      apexId: m.apexId,
      fpgId: m.fpgId || null,
      type: m.type,
      status: m.status,
      kyc: m.kyc,
      firstName,
      lastName,
      email: m.email,
      phone: "+0000000000",
      dateOfBirth: "1989-04-12",
      nationality: m.country,
      countryOfResidence: m.country,
      countryOfTaxResidence: m.country,
      isUsPerson: false,
      address: { street: "—", city: "—", postalCode: "—" },
      language: "EN",
      ibCode: m.ibCode,
      registrationSource: "APEX_PORTAL",
      registrationIp: `46.${rng.int(2, 250)}.${rng.int(2, 250)}.${rng.int(2, 250)}`,
      userAgent: "Mozilla/5.0",
      consents: [
        { document: "FPG T&C", version: "v4.2", acceptedAt: m.registeredAt, ip: "46.193.4.182", userAgent: "Mozilla/5.0" },
        { document: "Risk disclosure", version: "v3.1", acceptedAt: m.registeredAt, ip: "46.193.4.182", userAgent: "Mozilla/5.0" },
        { document: "Execution policy", version: "v2.4", acceptedAt: m.registeredAt, ip: "46.193.4.182", userAgent: "Mozilla/5.0" },
        { document: "Privacy notice", version: "v5.0", acceptedAt: m.registeredAt, ip: "46.193.4.182", userAgent: "Mozilla/5.0" },
      ],
      suitability: {
        experience: "3to5y",
        riskTolerance: "growth",
        netWorth: "50k_250k",
        objective: "growth",
        filledAt: m.registeredAt,
      },
      passwordHash: hash,
      passwordSalt: salt,
      totpSecret: null,
      totalDeposits: m.totalDeposits,
      netDeposit: m.netDeposit,
      volume30d: m.volume30d,
      accountsCount: m.accounts,
      createdAt: m.registeredAt,
      updatedAt: m.lastActivity,
      lastActivityAt: m.lastActivity,
      marketingSource: { utm_source: "newsletter", utm_campaign: "04-2026" },
    };
  });

  // Track max counters from existing IDs so newly created clients don't collide
  const maxApx = Math.max(
    ...clients.map((c) => Number(c.apexId.replace("APX-", "")) || 0)
  );
  const maxFpg = Math.max(
    ...clients
      .map((c) => Number(c.fpgId?.replace("FPG-", "") ?? 0))
      .filter(Boolean)
  );
  bumpCountersFromSeed(maxApx, maxFpg);

  /* ------------------- Generated clients for scale ---------------------- */
  const FIRST = ["Alex", "Noah", "Lena", "Mateo", "Aiko", "Zara", "Maya", "Leo", "Ines", "Niko", "Aria", "Eva", "Yuna", "Hugo", "Mila", "Theo"];
  const LAST = ["Tanaka", "Mendes", "Schulz", "Ricci", "Volkov", "Andersen", "Romero", "Larsson", "Khan", "Petersen", "Costa", "Park"];
  const COUNTRIES = ["Sweden", "France", "Germany", "Italy", "Japan", "Mexico", "Spain", "Cyprus", "UK", "Greece", "Netherlands", "UAE"];

  for (let i = 0; i < 370; i++) {
    const apexId = newApexId();
    const fpgId = rng.bool(0.92) ? newFpgClientId() : null;
    const isPending = !fpgId || rng.bool(0.05);
    const firstName = rng.pick(FIRST);
    const lastName = rng.pick(LAST);
    const createdAt = daysAgo(rng.int(1, 300));
    const { hash, salt } = hashPassword(DEMO_CLIENT_PASSWORD);
    clients.push({
      id: `c_gen_${i}`,
      apexId,
      fpgId,
      type: rng.pick(["Retail", "Retail", "Retail", "Pro", "Corporate"]),
      status: isPending ? "pending_kyc" : "approved",
      kyc: isPending
        ? rng.pick(["pending", "under_review", "resubmit_required", "document_missing"])
        : rng.bool(0.94)
          ? "approved"
          : "enhanced_due_diligence",
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: "+0000000000",
      dateOfBirth: "1990-01-01",
      nationality: rng.pick(COUNTRIES),
      countryOfResidence: rng.pick(COUNTRIES),
      countryOfTaxResidence: rng.pick(COUNTRIES),
      isUsPerson: false,
      address: { street: "—", city: "—", postalCode: "—" },
      language: "EN",
      ibCode: rng.pick(["APEX-IB-01", "APEX-IB-02", "APEX-IB-03"]),
      registrationSource: "APEX_PORTAL",
      registrationIp: `46.${rng.int(2, 250)}.${rng.int(2, 250)}.${rng.int(2, 250)}`,
      userAgent: "Mozilla/5.0",
      consents: [],
      suitability: null,
      passwordHash: hash,
      passwordSalt: salt,
      totpSecret: null,
      totalDeposits: isPending ? 0 : rng.int(1000, 250_000),
      netDeposit: isPending ? 0 : rng.int(500, 200_000),
      volume30d: isPending ? 0 : rng.int(50_000, 25_000_000),
      accountsCount: isPending ? 0 : rng.int(1, 3),
      createdAt,
      updatedAt: createdAt,
      lastActivityAt: daysAgo(rng.int(0, 30)),
      marketingSource: {},
    });
  }

  /* ------------------- Team members ------------------------------------ */
  const teamMembers: TeamMember[] = MOCK_TEAM.map((m) => {
    const { hash, salt } = hashPassword(DEMO_PASSWORD);
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      passwordHash: hash,
      passwordSalt: salt,
      totpSecret: generateTotpSecret(),
      twoFAEnforced: m.twoFA,
      createdAt: daysAgo(180),
      lastSeenAt: m.lastSeen === "—" ? null : m.lastSeen,
    };
  });

  /* ------------------- Trading accounts -------------------------------- */
  const tradingAccounts: TradingAccount[] = MOCK_ACCOUNTS.map((a) => {
    const client = clients.find((c) => c.apexId === a.clientApexId)!;
    return {
      id: a.id,
      login: a.login,
      clientApexId: a.clientApexId,
      clientFpgId: client?.fpgId ?? "FPG-0000000",
      platform: a.platform,
      mode: a.mode,
      accountType: a.accountType,
      server: a.server,
      currency: a.currency,
      leverage: a.leverage,
      balance: a.balance,
      equity: a.equity,
      margin: a.margin,
      freeMargin: a.freeMargin,
      status: a.status,
      openedAt: a.openedAt,
    };
  });

  /* ------------------- Deposits ---------------------------------------- */
  const deposits: DepositSession[] = MOCK_DEPOSITS.map((d) => {
    const client = clients.find((c) => c.apexId === d.clientApexId)!;
    return {
      id: d.id,
      fpgTxnId: d.fpgTxnId,
      clientApexId: d.clientApexId,
      clientFpgId: client?.fpgId ?? "FPG-0000000",
      accountLogin: d.account,
      amount: d.amount,
      currency: d.currency as DepositSession["currency"],
      method: d.method as DepositMethod,
      psp: d.psp,
      hostedUrl: `/fpg-psp-mock/${d.id}`,
      status: d.status,
      fees: d.fees,
      apexCorrelationId: d.apexCorrelationId,
      createdAt: d.createdAt,
      completedAt: d.completedAt,
    };
  });

  /* ------------------- Withdrawals ------------------------------------- */
  const withdrawals: Withdrawal[] = MOCK_WITHDRAWALS.map((w) => {
    const client = clients.find((c) => c.apexId === w.clientApexId)!;
    return {
      id: w.id,
      fpgTxnId: w.fpgTxnId,
      clientApexId: w.clientApexId,
      clientFpgId: client?.fpgId ?? "FPG-0000000",
      accountLogin: w.account,
      method: w.method,
      amount: w.amount,
      currency: w.currency as Withdrawal["currency"],
      status: w.status,
      rejectionReason: w.reason,
      apexCorrelationId: w.apexCorrelationId,
      destinationMasked:
        w.method.includes("Visa")
          ? "Visa **** 4421"
          : w.method.includes("SEPA")
            ? "SEPA · IBAN **** 4821"
            : w.method.includes("SWIFT")
              ? "SWIFT · IBAN **** 4821"
              : "Skrill · s.lindq*****@northforest.io",
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    };
  });

  /* ------------------- Webhooks --------------------------------------- */
  const webhookEvents: WebhookEvent[] = MOCK_WEBHOOKS.map((w) => ({
    id: w.id,
    eventId: w.eventId,
    type: w.type as WebhookEvent["type"],
    payload: { raw: w.payload },
    clientApexId: w.clientApexId,
    clientFpgId: clients.find((c) => c.apexId === w.clientApexId)?.fpgId ?? undefined,
    createdAt: w.receivedAt,
    status: w.status === "delivered" ? "delivered" : w.status === "retry" ? "retry" : "delivered",
    attempts: w.attempts,
    maxAttempts: 5,
    signature: w.signature,
    durationMs: w.durationMs,
    responseStatus: w.status === "delivered" ? 200 : 502,
    lastAttemptAt: w.receivedAt,
  }));

  // Generate more recent webhooks for the throughput chart
  for (let i = 0; i < 90; i++) {
    const t = minutesAgo(rng.int(1, 1440));
    const types: WebhookEvent["type"][] = [
      "deposit_completed",
      "withdrawal_under_review",
      "kyc_approved",
      "trade_closed",
      "trading_account_created",
      "leverage_changed",
    ];
    const type = rng.pick(types);
    webhookEvents.push({
      id: `wh_gen_${i}`,
      eventId: `evt_01HXY${rng.int(1000, 9999)}`,
      type,
      payload: { raw: `${type} synthetic` },
      createdAt: t,
      status: rng.bool(0.98) ? "delivered" : "retry",
      attempts: rng.bool(0.95) ? 1 : rng.int(2, 4),
      maxAttempts: 5,
      signature: `sha256=${rng.int(1000, 9999).toString(16)}…${rng.int(1000, 9999).toString(16)}`,
      durationMs: rng.int(40, 320),
      responseStatus: 200,
      lastAttemptAt: t,
    });
  }

  /* ------------------- Audit log -------------------------------------- */
  const auditLog: AuditEntry[] = MOCK_AUDIT.map((l) => ({
    id: l.id,
    at: l.at,
    actor: l.actor,
    actorRole: l.actorRole,
    action: l.action,
    target: l.target,
    ip: l.ip,
    result: l.result,
  }));

  /* ------------------- API keys --------------------------------------- */
  const apiKeys: ApiKey[] = MOCK_APIKEYS.map((k) => ({
    id: k.id,
    label: k.label,
    prefix: k.prefix,
    hashedKey: sha256(`${k.prefix}seed-${k.id}`),
    lastUsed: k.lastUsed,
    ipAllowlist: k.ipAllowlist,
    scopes: k.scopes,
    status: k.status,
    createdAt: k.createdAt,
    createdBy: "Ariane Martin",
  }));

  /* ------------------- Reconciliation --------------------------------- */
  const reconciliation: ReconciliationRow[] = MOCK_RECON.map((r) => ({
    date: r.date,
    fpgDeposits: r.fpgDeposits,
    apexDeposits: r.apexDeposits,
    fpgWithdrawals: r.fpgWithdrawals,
    apexWithdrawals: r.apexWithdrawals,
    fpgVolumeLots: r.fpgVolumeLots,
    apexVolumeLots: r.apexVolumeLots,
    delta: r.delta,
    status: r.status,
    note: r.status === "delta" ? "Suspected late chargeback adjustment — webhook replay scheduled" : undefined,
  }));

  /* ------------------- IB volumes & commissions ----------------------- */
  const ibVolumes: IbVolumeRow[] = [];
  const commissions: CommissionEntry[] = [];
  const SYMBOLS = ["EURUSD", "XAUUSD", "GBPUSD", "US100", "BTCUSD", "USDJPY"];
  const liveClients = clients.filter((c) => c.status === "approved");
  for (let d = 30; d >= 0; d--) {
    const date = daysAgo(d).slice(0, 10);
    for (const sym of SYMBOLS) {
      // Aggregate volume per symbol per day across all clients
      const lots = rng.int(200, 1500) * (sym === "EURUSD" ? 4 : 1);
      const notional = lots * (sym === "XAUUSD" ? 100_000 : sym === "US100" ? 30_000 : sym === "BTCUSD" ? 60_000 : 100_000);
      ibVolumes.push({
        id: `vol_${date}_${sym}`,
        date,
        ibCode: "APEX-IB-01",
        clientApexId: rng.pick(liveClients).apexId,
        accountLogin: "AGG",
        symbol: sym,
        side: rng.pick(["Buy", "Sell"]),
        lots,
        notional,
        trades: rng.int(40, 320),
      });
      commissions.push({
        id: `com_${date}_${sym}`,
        date,
        ibCode: "APEX-IB-01",
        symbol: sym,
        lots,
        rateUsdPerLot: 8.45,
        amount: lots * 8.45,
        type: "trade",
      });
    }
  }
  // Scalping exclusion (per the formula)
  commissions.push({
    id: "com_adj_scalp_05",
    date: "2026-05-23",
    ibCode: "APEX-IB-01",
    accountLogin: "FPG7740921-L1",
    symbol: "EURUSD",
    lots: -218,
    rateUsdPerLot: 8.45,
    amount: -1842,
    type: "scalping_excluded",
    reason: "Trades held < 60 seconds (8 trades)",
  });
  commissions.push({
    id: "com_adj_excl_01",
    date: "2026-05-18",
    ibCode: "APEX-IB-01",
    clientApexId: "APX-100530",
    lots: -112,
    rateUsdPerLot: 8.45,
    amount: -946,
    type: "client_excluded",
    reason: "Excluded client APX-100530 (compliance hold)",
  });
  commissions.push({
    id: "com_adj_cb_01",
    date: "2026-05-14",
    ibCode: "APEX-IB-01",
    clientApexId: "APX-100517",
    lots: 0,
    rateUsdPerLot: 0,
    amount: -1200,
    type: "chargeback",
    reason: "Deposit chargeback APX-100517 — refund pending",
  });
  commissions.push({
    id: "com_adj_reb_01",
    date: "2026-05-08",
    ibCode: "APEX-IB-01",
    lots: 0,
    rateUsdPerLot: 0,
    amount: 3200,
    type: "rebate",
    reason: "Volume threshold bonus — APEX-IB-01",
  });

  /* ------------------- Statements ------------------------------------- */
  const statements: MonthlyStatement[] = [
    { id: "stmt_2026_05", ibCode: "APEX-IB-01", period: "2026-05", grossAmount: 184240, adjustmentsAmount: -13178, netPayable: 171062, lots: 20244, rateAverage: 8.45, generatedAt: "2026-05-25T00:30:00Z", dueDate: "2026-06-15", status: "pending" },
    { id: "stmt_2026_04", ibCode: "APEX-IB-01", period: "2026-04", grossAmount: 152800, adjustmentsAmount: -9810, netPayable: 142990, lots: 18420, rateAverage: 8.30, generatedAt: "2026-05-01T03:00:00Z", dueDate: "2026-05-15", status: "paid", paidAt: "2026-05-14T16:00:00Z" },
    { id: "stmt_2026_03", ibCode: "APEX-IB-01", period: "2026-03", grossAmount: 138800, adjustmentsAmount: -8200, netPayable: 130600, lots: 17110, rateAverage: 8.10, generatedAt: "2026-04-01T03:00:00Z", dueDate: "2026-04-15", status: "paid", paidAt: "2026-04-14T16:00:00Z" },
    { id: "stmt_2026_02", ibCode: "APEX-IB-01", period: "2026-02", grossAmount: 118400, adjustmentsAmount: -7100, netPayable: 111300, lots: 14620, rateAverage: 8.10, generatedAt: "2026-03-01T03:00:00Z", dueDate: "2026-03-15", status: "paid", paidAt: "2026-03-14T16:00:00Z" },
    { id: "stmt_2026_01", ibCode: "APEX-IB-01", period: "2026-01", grossAmount: 98400, adjustmentsAmount: -5800, netPayable: 92600, lots: 12180, rateAverage: 8.08, generatedAt: "2026-02-01T03:00:00Z", dueDate: "2026-02-15", status: "paid", paidAt: "2026-02-14T16:00:00Z" },
  ];

  /* ------------------- Trades (closed) -------------------------------- */
  const trades: Trade[] = [];
  const sebAccount = "FPG7740921-L1";
  const sebTradeSeed: Array<[string, "Buy" | "Sell", number, number, number, number, number, number]> = [
    ["#812441", "Buy", 2.0, 1.0822, 1.0851, -10, -1.2, 580],
    ["#812389", "Sell", 0.5, 2389.5, 2382.1, -5, 0, 370],
    ["#812371", "Buy", 1.0, 18712, 18762, -8, 0, 500],
    ["#812302", "Sell", 1.5, 1.2671, 1.2654, -8, 0, 255],
    ["#812254", "Buy", 1.0, 1.0834, 1.0820, -5, 0, -140],
  ];
  const symbolForTicket = ["EURUSD", "XAUUSD", "US100", "GBPUSD", "EURUSD"];
  sebTradeSeed.forEach((t, i) => {
    trades.push({
      id: `tr_${i}`,
      ticket: t[0] as string,
      accountLogin: sebAccount,
      clientApexId: "APX-100482",
      symbol: symbolForTicket[i],
      side: t[1],
      lots: t[2],
      openTime: daysAgo(3 - i),
      closeTime: daysAgo(3 - i),
      openPrice: t[3],
      closePrice: t[4],
      commission: t[5],
      swap: t[6],
      pnl: t[7],
    });
  });

  /* ------------------- Open positions --------------------------------- */
  const openPositions: OpenPosition[] = [
    { ticket: "#813104", accountLogin: sebAccount, symbol: "EURUSD", side: "Buy", lots: 1.5, openTime: minutesAgo(120), openPrice: 1.0842, currentPrice: 1.0876, pnl: 510 },
    { ticket: "#813088", accountLogin: sebAccount, symbol: "XAUUSD", side: "Buy", lots: 0.4, openTime: minutesAgo(80), openPrice: 2384.5, currentPrice: 2398.2, pnl: 548 },
    { ticket: "#813072", accountLogin: sebAccount, symbol: "US100", side: "Sell", lots: 0.8, openTime: minutesAgo(45), openPrice: 18840, currentPrice: 18762, pnl: 624 },
    { ticket: "#813021", accountLogin: sebAccount, symbol: "GBPUSD", side: "Buy", lots: 0.5, openTime: minutesAgo(20), openPrice: 1.2641, currentPrice: 1.2664, pnl: -69 },
  ];

  /* ------------------- KYC documents ---------------------------------- */
  const kycDocuments: KycDocument[] = [];
  const docKinds: Array<KycDocument["kind"]> = ["passport", "selfie", "proof_of_address"];
  for (const c of clients.slice(0, 30)) {
    if (c.kyc === "approved" || c.kyc === "enhanced_due_diligence") {
      for (const kind of docKinds) {
        kycDocuments.push({
          id: `doc_${c.apexId}_${kind}`,
          clientApexId: c.apexId,
          clientFpgId: c.fpgId,
          kind,
          filename: `${kind}_${c.lastName.toLowerCase()}.pdf`,
          mime: kind === "selfie" ? "image/jpeg" : "application/pdf",
          bytes: 1024 * 1200,
          sha256: sha256(`${c.apexId}-${kind}`),
          status: "verified",
          uploadedAt: c.createdAt,
          reviewedAt: c.createdAt,
          reviewerId: "t_02",
        });
      }
    }
  }

  /* ------------------- Config & misc ---------------------------------- */
  const config: ServerConfig = {
    apexWebhookUrl: process.env.APEX_WEBHOOK_URL ?? "http://localhost:3000/api/internal/webhooks/fpg",
    fpgWebhookUrl: process.env.FPG_WEBHOOK_URL ?? "http://localhost:3000/api/fpg/v1/webhooks/inbound",
    webhookDispatchDelayMs: 800,
    rateLimitsEnabled: true,
    signatureVerificationEnabled: true,
    persistEnabled: true,
  };

  const sessions: Session[] = [];

  return {
    clients,
    tradingAccounts,
    trades,
    openPositions,
    kycDocuments,
    deposits,
    withdrawals,
    ibVolumes,
    commissions,
    statements,
    reconciliation,
    webhookEvents,
    sessions,
    teamMembers,
    apiKeys,
    fpgTokens: [],
    idempotency: [],
    auditLog,
    config,
  };
}

export const DEMO_CREDENTIALS = {
  adminEmail: "ariane.m@apex-ops.com",
  adminPassword: DEMO_PASSWORD,
  clientEmail: "s.lindqvist@northforest.io",
  clientPassword: DEMO_CLIENT_PASSWORD,
  twoFaCode: "123456",
};
