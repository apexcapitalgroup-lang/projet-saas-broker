// Deterministic mock data for the APEX powered by FPG console.
// All figures and identifiers are fictitious.

export type Client = {
  id: string;
  apexId: string;
  fpgId: string;
  name: string;
  email: string;
  country: string;
  type: "Retail" | "Pro" | "Corporate";
  status:
    | "draft"
    | "pending_kyc"
    | "approved"
    | "rejected"
    | "suspended"
    | "closed";
  kyc:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "resubmit_required"
    | "document_missing"
    | "compliance_hold"
    | "enhanced_due_diligence";
  ibCode: string;
  registeredAt: string;
  lastActivity: string;
  totalDeposits: number;
  netDeposit: number;
  volume30d: number;
  accounts: number;
};

export const CLIENTS: Client[] = [
  {
    id: "c_01HX",
    apexId: "APX-100482",
    fpgId: "FPG-7740921",
    name: "Sebastian Lindqvist",
    email: "s.lindqvist@northforest.io",
    country: "Sweden",
    type: "Retail",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-04-12T09:14:00Z",
    lastActivity: "2026-05-24T18:02:00Z",
    totalDeposits: 124500,
    netDeposit: 96800,
    volume30d: 4_820_000,
    accounts: 2,
  },
  {
    id: "c_02HX",
    apexId: "APX-100483",
    fpgId: "FPG-7740964",
    name: "Helena Marchetti",
    email: "h.marchetti@brivocapital.com",
    country: "Switzerland",
    type: "Pro",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-04-15T10:21:00Z",
    lastActivity: "2026-05-25T08:45:00Z",
    totalDeposits: 482000,
    netDeposit: 396000,
    volume30d: 18_600_000,
    accounts: 3,
  },
  {
    id: "c_03HX",
    apexId: "APX-100501",
    fpgId: "",
    name: "Damien Larue",
    email: "damien.larue@gmail.com",
    country: "France",
    type: "Retail",
    status: "pending_kyc",
    kyc: "resubmit_required",
    ibCode: "APEX-IB-02",
    registeredAt: "2026-05-22T11:02:00Z",
    lastActivity: "2026-05-25T07:31:00Z",
    totalDeposits: 0,
    netDeposit: 0,
    volume30d: 0,
    accounts: 0,
  },
  {
    id: "c_04HX",
    apexId: "APX-100502",
    fpgId: "FPG-7741112",
    name: "Aletheia Holdings Ltd",
    email: "ops@aletheiaholdings.co.uk",
    country: "United Kingdom",
    type: "Corporate",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-03-08T16:40:00Z",
    lastActivity: "2026-05-25T09:11:00Z",
    totalDeposits: 1_250_000,
    netDeposit: 1_050_000,
    volume30d: 62_400_000,
    accounts: 4,
  },
  {
    id: "c_05HX",
    apexId: "APX-100517",
    fpgId: "FPG-7741209",
    name: "Yuto Nakamura",
    email: "y.nakamura@hikari.jp",
    country: "Japan",
    type: "Retail",
    status: "approved",
    kyc: "under_review",
    ibCode: "APEX-IB-02",
    registeredAt: "2026-05-19T03:55:00Z",
    lastActivity: "2026-05-24T22:18:00Z",
    totalDeposits: 15000,
    netDeposit: 15000,
    volume30d: 184_000,
    accounts: 1,
  },
  {
    id: "c_06HX",
    apexId: "APX-100530",
    fpgId: "FPG-7741301",
    name: "Margarita Sosa",
    email: "m.sosa@ven-trade.mx",
    country: "Mexico",
    type: "Retail",
    status: "suspended",
    kyc: "compliance_hold",
    ibCode: "APEX-IB-02",
    registeredAt: "2026-02-24T13:11:00Z",
    lastActivity: "2026-05-12T15:04:00Z",
    totalDeposits: 72000,
    netDeposit: 41200,
    volume30d: 0,
    accounts: 1,
  },
  {
    id: "c_07HX",
    apexId: "APX-100545",
    fpgId: "FPG-7741415",
    name: "Pavel Krause",
    email: "p.krause@vector-fx.de",
    country: "Germany",
    type: "Pro",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-01-30T09:32:00Z",
    lastActivity: "2026-05-25T06:00:00Z",
    totalDeposits: 280000,
    netDeposit: 198400,
    volume30d: 14_200_000,
    accounts: 2,
  },
  {
    id: "c_08HX",
    apexId: "APX-100571",
    fpgId: "",
    name: "Tomás Fernández",
    email: "tomas.f@cordilleratrade.cl",
    country: "Chile",
    type: "Retail",
    status: "pending_kyc",
    kyc: "document_missing",
    ibCode: "APEX-IB-03",
    registeredAt: "2026-05-24T17:48:00Z",
    lastActivity: "2026-05-25T08:51:00Z",
    totalDeposits: 0,
    netDeposit: 0,
    volume30d: 0,
    accounts: 0,
  },
  {
    id: "c_09HX",
    apexId: "APX-100588",
    fpgId: "FPG-7741528",
    name: "Anastasia Volkov",
    email: "a.volkov@stellaria.cy",
    country: "Cyprus",
    type: "Retail",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-02",
    registeredAt: "2026-04-02T07:11:00Z",
    lastActivity: "2026-05-25T05:42:00Z",
    totalDeposits: 38000,
    netDeposit: 27500,
    volume30d: 2_140_000,
    accounts: 1,
  },
  {
    id: "c_10HX",
    apexId: "APX-100612",
    fpgId: "FPG-7741670",
    name: "Northwind Capital LLC",
    email: "treasury@northwind.us",
    country: "United States",
    type: "Corporate",
    status: "approved",
    kyc: "enhanced_due_diligence",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-03-19T20:33:00Z",
    lastActivity: "2026-05-25T01:18:00Z",
    totalDeposits: 1_800_000,
    netDeposit: 1_440_000,
    volume30d: 89_100_000,
    accounts: 5,
  },
  {
    id: "c_11HX",
    apexId: "APX-100640",
    fpgId: "FPG-7741812",
    name: "Mira Patel",
    email: "mira.p@kalpana-trading.in",
    country: "India",
    type: "Retail",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-03",
    registeredAt: "2026-04-22T12:00:00Z",
    lastActivity: "2026-05-24T20:09:00Z",
    totalDeposits: 8200,
    netDeposit: 7100,
    volume30d: 612_000,
    accounts: 1,
  },
  {
    id: "c_12HX",
    apexId: "APX-100655",
    fpgId: "FPG-7741890",
    name: "Lucas Boucher",
    email: "l.boucher@cobalt-fx.fr",
    country: "France",
    type: "Pro",
    status: "approved",
    kyc: "approved",
    ibCode: "APEX-IB-01",
    registeredAt: "2026-04-05T11:14:00Z",
    lastActivity: "2026-05-25T08:31:00Z",
    totalDeposits: 156000,
    netDeposit: 124000,
    volume30d: 6_980_000,
    accounts: 2,
  },
];

/* -------------------------------------------------------------------------- */
/*  Trading accounts                                                           */
/* -------------------------------------------------------------------------- */

export type TradingAccount = {
  id: string;
  clientApexId: string;
  clientName: string;
  login: string;
  server: "FPG-Live-01" | "FPG-Live-02" | "FPG-Demo-01" | "FPG-Live-03";
  platform: "MT5" | "MT4";
  accountType: "Standard" | "Pro" | "Raw" | "ECN" | "Islamic";
  mode: "Live" | "Demo";
  currency: "USD" | "EUR" | "GBP" | "JPY";
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  status: "active" | "inactive" | "suspended" | "restricted";
  openedAt: string;
};

export const TRADING_ACCOUNTS: TradingAccount[] = [
  {
    id: "ta_01",
    clientApexId: "APX-100482",
    clientName: "Sebastian Lindqvist",
    login: "FPG7740921-L1",
    server: "FPG-Live-01",
    platform: "MT5",
    accountType: "Pro",
    mode: "Live",
    currency: "USD",
    leverage: 200,
    balance: 96800,
    equity: 98412.55,
    margin: 12420,
    freeMargin: 85992.55,
    status: "active",
    openedAt: "2026-04-13T10:02:00Z",
  },
  {
    id: "ta_02",
    clientApexId: "APX-100482",
    clientName: "Sebastian Lindqvist",
    login: "FPG7740921-D1",
    server: "FPG-Demo-01",
    platform: "MT5",
    accountType: "Standard",
    mode: "Demo",
    currency: "USD",
    leverage: 500,
    balance: 50000,
    equity: 50124.0,
    margin: 0,
    freeMargin: 50124.0,
    status: "active",
    openedAt: "2026-04-12T11:00:00Z",
  },
  {
    id: "ta_03",
    clientApexId: "APX-100483",
    clientName: "Helena Marchetti",
    login: "FPG7740964-L1",
    server: "FPG-Live-02",
    platform: "MT5",
    accountType: "Raw",
    mode: "Live",
    currency: "EUR",
    leverage: 100,
    balance: 396000,
    equity: 401820.4,
    margin: 78400,
    freeMargin: 323420.4,
    status: "active",
    openedAt: "2026-04-15T11:00:00Z",
  },
  {
    id: "ta_04",
    clientApexId: "APX-100502",
    clientName: "Aletheia Holdings Ltd",
    login: "FPG7741112-L1",
    server: "FPG-Live-03",
    platform: "MT5",
    accountType: "ECN",
    mode: "Live",
    currency: "USD",
    leverage: 50,
    balance: 1_050_000,
    equity: 1_071_500.55,
    margin: 244000,
    freeMargin: 827500.55,
    status: "active",
    openedAt: "2026-03-09T08:11:00Z",
  },
  {
    id: "ta_05",
    clientApexId: "APX-100517",
    clientName: "Yuto Nakamura",
    login: "FPG7741209-L1",
    server: "FPG-Live-01",
    platform: "MT4",
    accountType: "Standard",
    mode: "Live",
    currency: "JPY",
    leverage: 200,
    balance: 1_500_000,
    equity: 1_512_400,
    margin: 92000,
    freeMargin: 1_420_400,
    status: "active",
    openedAt: "2026-05-20T04:13:00Z",
  },
  {
    id: "ta_06",
    clientApexId: "APX-100530",
    clientName: "Margarita Sosa",
    login: "FPG7741301-L1",
    server: "FPG-Live-02",
    platform: "MT5",
    accountType: "Standard",
    mode: "Live",
    currency: "USD",
    leverage: 100,
    balance: 41200,
    equity: 41200,
    margin: 0,
    freeMargin: 41200,
    status: "suspended",
    openedAt: "2026-02-25T14:00:00Z",
  },
  {
    id: "ta_07",
    clientApexId: "APX-100612",
    clientName: "Northwind Capital LLC",
    login: "FPG7741670-L1",
    server: "FPG-Live-03",
    platform: "MT5",
    accountType: "ECN",
    mode: "Live",
    currency: "USD",
    leverage: 30,
    balance: 1_440_000,
    equity: 1_482_311.2,
    margin: 412000,
    freeMargin: 1_070_311.2,
    status: "active",
    openedAt: "2026-03-20T21:18:00Z",
  },
  {
    id: "ta_08",
    clientApexId: "APX-100612",
    clientName: "Northwind Capital LLC",
    login: "FPG7741670-L2",
    server: "FPG-Live-03",
    platform: "MT5",
    accountType: "Raw",
    mode: "Live",
    currency: "USD",
    leverage: 30,
    balance: 720000,
    equity: 728120.55,
    margin: 162000,
    freeMargin: 566120.55,
    status: "active",
    openedAt: "2026-04-12T11:02:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/*  Deposits                                                                   */
/* -------------------------------------------------------------------------- */

export type Deposit = {
  id: string;
  clientApexId: string;
  clientName: string;
  account: string;
  method:
    | "Visa / Mastercard"
    | "Bank transfer"
    | "USDT (TRC20)"
    | "USDT (ERC20)"
    | "Skrill"
    | "Neteller";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "rejected" | "chargeback" | "refunded";
  psp: "Apex-PSP-FPG" | "FPG-Crypto-Gateway" | "FPG-Bank-Rails";
  fpgTxnId: string;
  apexCorrelationId: string;
  createdAt: string;
  completedAt?: string;
  fees: number;
};

export const DEPOSITS: Deposit[] = [
  {
    id: "dp_01",
    clientApexId: "APX-100482",
    clientName: "Sebastian Lindqvist",
    account: "FPG7740921-L1",
    method: "Visa / Mastercard",
    amount: 25000,
    currency: "USD",
    status: "completed",
    psp: "Apex-PSP-FPG",
    fpgTxnId: "FPG-DEP-A8412",
    apexCorrelationId: "apex-dep-7e2c4a",
    createdAt: "2026-05-25T07:12:00Z",
    completedAt: "2026-05-25T07:14:31Z",
    fees: 87.5,
  },
  {
    id: "dp_02",
    clientApexId: "APX-100483",
    clientName: "Helena Marchetti",
    account: "FPG7740964-L1",
    method: "Bank transfer",
    amount: 80000,
    currency: "EUR",
    status: "pending",
    psp: "FPG-Bank-Rails",
    fpgTxnId: "FPG-DEP-A8417",
    apexCorrelationId: "apex-dep-9aa01b",
    createdAt: "2026-05-25T08:11:00Z",
    fees: 0,
  },
  {
    id: "dp_03",
    clientApexId: "APX-100502",
    clientName: "Aletheia Holdings Ltd",
    account: "FPG7741112-L1",
    method: "Bank transfer",
    amount: 250000,
    currency: "USD",
    status: "completed",
    psp: "FPG-Bank-Rails",
    fpgTxnId: "FPG-DEP-A8409",
    apexCorrelationId: "apex-dep-c40e8d",
    createdAt: "2026-05-24T15:31:00Z",
    completedAt: "2026-05-25T09:00:14Z",
    fees: 0,
  },
  {
    id: "dp_04",
    clientApexId: "APX-100517",
    clientName: "Yuto Nakamura",
    account: "FPG7741209-L1",
    method: "USDT (TRC20)",
    amount: 5000,
    currency: "USD",
    status: "completed",
    psp: "FPG-Crypto-Gateway",
    fpgTxnId: "FPG-DEP-A8418",
    apexCorrelationId: "apex-dep-1d7a02",
    createdAt: "2026-05-25T05:42:00Z",
    completedAt: "2026-05-25T05:44:08Z",
    fees: 1.0,
  },
  {
    id: "dp_05",
    clientApexId: "APX-100612",
    clientName: "Northwind Capital LLC",
    account: "FPG7741670-L1",
    method: "Bank transfer",
    amount: 400000,
    currency: "USD",
    status: "completed",
    psp: "FPG-Bank-Rails",
    fpgTxnId: "FPG-DEP-A8401",
    apexCorrelationId: "apex-dep-90b7e1",
    createdAt: "2026-05-23T12:11:00Z",
    completedAt: "2026-05-24T09:30:14Z",
    fees: 0,
  },
  {
    id: "dp_06",
    clientApexId: "APX-100640",
    clientName: "Mira Patel",
    account: "FPG7741812-L1",
    method: "USDT (TRC20)",
    amount: 1200,
    currency: "USD",
    status: "failed",
    psp: "FPG-Crypto-Gateway",
    fpgTxnId: "FPG-DEP-A8420",
    apexCorrelationId: "apex-dep-37f4b8",
    createdAt: "2026-05-25T03:01:00Z",
    fees: 0,
  },
  {
    id: "dp_07",
    clientApexId: "APX-100655",
    clientName: "Lucas Boucher",
    account: "FPG7741890-L1",
    method: "Visa / Mastercard",
    amount: 12000,
    currency: "EUR",
    status: "completed",
    psp: "Apex-PSP-FPG",
    fpgTxnId: "FPG-DEP-A8412",
    apexCorrelationId: "apex-dep-aa01ce",
    createdAt: "2026-05-25T08:31:00Z",
    completedAt: "2026-05-25T08:32:14Z",
    fees: 42.0,
  },
  {
    id: "dp_08",
    clientApexId: "APX-100545",
    clientName: "Pavel Krause",
    account: "FPG7741415-L1",
    method: "Skrill",
    amount: 18000,
    currency: "EUR",
    status: "completed",
    psp: "Apex-PSP-FPG",
    fpgTxnId: "FPG-DEP-A8395",
    apexCorrelationId: "apex-dep-50c2a4",
    createdAt: "2026-05-22T11:30:00Z",
    completedAt: "2026-05-22T11:32:14Z",
    fees: 54.0,
  },
];

/* -------------------------------------------------------------------------- */
/*  Withdrawals                                                                */
/* -------------------------------------------------------------------------- */

export type Withdrawal = {
  id: string;
  clientApexId: string;
  clientName: string;
  account: string;
  method: string;
  amount: number;
  currency: string;
  status:
    | "requested"
    | "under_review"
    | "approved"
    | "processing"
    | "completed"
    | "rejected"
    | "failed";
  reason?: string;
  fpgTxnId?: string;
  apexCorrelationId: string;
  createdAt: string;
  updatedAt: string;
};

export const WITHDRAWALS: Withdrawal[] = [
  {
    id: "wd_01",
    clientApexId: "APX-100483",
    clientName: "Helena Marchetti",
    account: "FPG7740964-L1",
    method: "Bank transfer (SEPA)",
    amount: 40000,
    currency: "EUR",
    status: "under_review",
    apexCorrelationId: "apex-wd-9114ce",
    createdAt: "2026-05-25T06:14:00Z",
    updatedAt: "2026-05-25T08:00:00Z",
  },
  {
    id: "wd_02",
    clientApexId: "APX-100482",
    clientName: "Sebastian Lindqvist",
    account: "FPG7740921-L1",
    method: "Visa / Mastercard",
    amount: 8000,
    currency: "USD",
    status: "completed",
    fpgTxnId: "FPG-WD-X4421",
    apexCorrelationId: "apex-wd-71a82b",
    createdAt: "2026-05-23T11:00:00Z",
    updatedAt: "2026-05-24T11:14:00Z",
  },
  {
    id: "wd_03",
    clientApexId: "APX-100502",
    clientName: "Aletheia Holdings Ltd",
    account: "FPG7741112-L1",
    method: "Bank transfer (SWIFT)",
    amount: 200000,
    currency: "USD",
    status: "processing",
    fpgTxnId: "FPG-WD-X4423",
    apexCorrelationId: "apex-wd-44d18e",
    createdAt: "2026-05-24T14:00:00Z",
    updatedAt: "2026-05-25T08:20:00Z",
  },
  {
    id: "wd_04",
    clientApexId: "APX-100530",
    clientName: "Margarita Sosa",
    account: "FPG7741301-L1",
    method: "Bank transfer",
    amount: 18500,
    currency: "USD",
    status: "rejected",
    reason: "AML — source of funds documentation required",
    apexCorrelationId: "apex-wd-91d2bc",
    createdAt: "2026-05-12T15:04:00Z",
    updatedAt: "2026-05-12T18:14:00Z",
  },
  {
    id: "wd_05",
    clientApexId: "APX-100545",
    clientName: "Pavel Krause",
    account: "FPG7741415-L1",
    method: "Skrill",
    amount: 4200,
    currency: "EUR",
    status: "approved",
    fpgTxnId: "FPG-WD-X4419",
    apexCorrelationId: "apex-wd-12cd45",
    createdAt: "2026-05-25T03:14:00Z",
    updatedAt: "2026-05-25T05:00:00Z",
  },
  {
    id: "wd_06",
    clientApexId: "APX-100612",
    clientName: "Northwind Capital LLC",
    account: "FPG7741670-L2",
    method: "Bank transfer (SWIFT)",
    amount: 380000,
    currency: "USD",
    status: "approved",
    fpgTxnId: "FPG-WD-X4425",
    apexCorrelationId: "apex-wd-98ee0a",
    createdAt: "2026-05-25T07:01:00Z",
    updatedAt: "2026-05-25T08:55:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/*  Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

export type Webhook = {
  id: string;
  eventId: string;
  type: string;
  payload: string;
  clientApexId?: string;
  status: "delivered" | "retry" | "dropped" | "pending";
  attempts: number;
  signature: string;
  receivedAt: string;
  durationMs: number;
};

export const WEBHOOKS: Webhook[] = [
  {
    id: "wh_01",
    eventId: "evt_01HXY8K2Q7N",
    type: "deposit_completed",
    payload: "dp_01 amount=25000 USD",
    clientApexId: "APX-100482",
    status: "delivered",
    attempts: 1,
    signature: "sha256=4e2c…d09a",
    receivedAt: "2026-05-25T07:14:32Z",
    durationMs: 142,
  },
  {
    id: "wh_02",
    eventId: "evt_01HXY8K2Q8N",
    type: "kyc_approved",
    payload: "client_id=FPG-7740921 reason=automated",
    clientApexId: "APX-100482",
    status: "delivered",
    attempts: 1,
    signature: "sha256=21de…2244",
    receivedAt: "2026-05-25T07:10:18Z",
    durationMs: 88,
  },
  {
    id: "wh_03",
    eventId: "evt_01HXY8K3W12",
    type: "withdrawal_under_review",
    payload: "wd_01 amount=40000 EUR reason=manual_review",
    clientApexId: "APX-100483",
    status: "delivered",
    attempts: 1,
    signature: "sha256=9d40…11af",
    receivedAt: "2026-05-25T08:00:14Z",
    durationMs: 121,
  },
  {
    id: "wh_04",
    eventId: "evt_01HXY8K3W19",
    type: "trading_account_created",
    payload: "login=FPG7741812-L1 currency=USD leverage=200",
    clientApexId: "APX-100640",
    status: "delivered",
    attempts: 1,
    signature: "sha256=07a1…39cc",
    receivedAt: "2026-05-25T06:12:08Z",
    durationMs: 96,
  },
  {
    id: "wh_05",
    eventId: "evt_01HXY8K4F02",
    type: "deposit_failed",
    payload: "dp_06 amount=1200 USDT reason=insufficient_balance",
    clientApexId: "APX-100640",
    status: "retry",
    attempts: 3,
    signature: "sha256=98ee…aa10",
    receivedAt: "2026-05-25T03:01:22Z",
    durationMs: 4002,
  },
  {
    id: "wh_06",
    eventId: "evt_01HXY8K4F08",
    type: "compliance_hold",
    payload: "client_id=FPG-7741301 reason=AML_review",
    clientApexId: "APX-100530",
    status: "delivered",
    attempts: 1,
    signature: "sha256=a401…77bf",
    receivedAt: "2026-05-25T01:14:00Z",
    durationMs: 154,
  },
  {
    id: "wh_07",
    eventId: "evt_01HXY8K5J12",
    type: "daily_volume_ready",
    payload: "date=2026-05-24 clients=3284 total_lots=128450.12",
    status: "delivered",
    attempts: 1,
    signature: "sha256=5fae…1129",
    receivedAt: "2026-05-25T00:30:00Z",
    durationMs: 88,
  },
  {
    id: "wh_08",
    eventId: "evt_01HXY8K5J19",
    type: "kyc_resubmit_required",
    payload: "client_id=APX-100501 document=proof_of_address",
    clientApexId: "APX-100501",
    status: "delivered",
    attempts: 1,
    signature: "sha256=8814…7700",
    receivedAt: "2026-05-25T07:31:14Z",
    durationMs: 102,
  },
  {
    id: "wh_09",
    eventId: "evt_01HXY8K6L08",
    type: "withdrawal_completed",
    payload: "wd_02 amount=8000 USD",
    clientApexId: "APX-100482",
    status: "delivered",
    attempts: 1,
    signature: "sha256=11dd…aa90",
    receivedAt: "2026-05-24T11:14:00Z",
    durationMs: 167,
  },
  {
    id: "wh_10",
    eventId: "evt_01HXY8K6L14",
    type: "leverage_changed",
    payload: "login=FPG7740964-L1 from=200 to=100",
    clientApexId: "APX-100483",
    status: "delivered",
    attempts: 1,
    signature: "sha256=cd40…9929",
    receivedAt: "2026-05-22T15:42:14Z",
    durationMs: 94,
  },
];

/* -------------------------------------------------------------------------- */
/*  Audit log                                                                  */
/* -------------------------------------------------------------------------- */

export type AuditLog = {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  target?: string;
  ip: string;
  result: "success" | "failure";
};

export const AUDIT_LOG: AuditLog[] = [
  {
    id: "log_01",
    at: "2026-05-25T08:55:14Z",
    actor: "Camille Roux",
    actorRole: "Compliance Officer",
    action: "Approved withdrawal",
    target: "wd_06 · Northwind Capital LLC · 380,000 USD",
    ip: "82.66.41.18",
    result: "success",
  },
  {
    id: "log_02",
    at: "2026-05-25T08:30:01Z",
    actor: "Hannah Weber",
    actorRole: "Operations",
    action: "Triggered webhook replay",
    target: "evt_01HXY8K4F02 · deposit_failed",
    ip: "82.66.41.21",
    result: "success",
  },
  {
    id: "log_03",
    at: "2026-05-25T08:12:48Z",
    actor: "API key apex-prod-#1",
    actorRole: "Service account",
    action: "GET /v1/clients/APX-100502/trades",
    target: "Aletheia Holdings Ltd",
    ip: "10.42.7.91",
    result: "success",
  },
  {
    id: "log_04",
    at: "2026-05-25T08:00:14Z",
    actor: "FPG webhook",
    actorRole: "External",
    action: "withdrawal_under_review",
    target: "wd_01 · Helena Marchetti",
    ip: "44.221.18.7",
    result: "success",
  },
  {
    id: "log_05",
    at: "2026-05-25T07:42:33Z",
    actor: "Ariane Martin",
    actorRole: "Compliance Officer",
    action: "Requested document resubmission",
    target: "APX-100501 · proof_of_address",
    ip: "82.66.41.14",
    result: "success",
  },
  {
    id: "log_06",
    at: "2026-05-25T07:12:14Z",
    actor: "Ariane Martin",
    actorRole: "Compliance Officer",
    action: "Logged in (TOTP verified)",
    ip: "82.66.41.14",
    result: "success",
  },
  {
    id: "log_07",
    at: "2026-05-25T01:18:22Z",
    actor: "Unknown",
    actorRole: "—",
    action: "Failed login attempt",
    target: "ariane.m@apex-ops.com",
    ip: "185.220.101.45",
    result: "failure",
  },
  {
    id: "log_08",
    at: "2026-05-25T00:30:00Z",
    actor: "FPG webhook",
    actorRole: "External",
    action: "daily_volume_ready",
    target: "date=2026-05-24",
    ip: "44.221.18.7",
    result: "success",
  },
  {
    id: "log_09",
    at: "2026-05-24T22:14:00Z",
    actor: "Marc Lefevre",
    actorRole: "Finance",
    action: "Exported commissions statement",
    target: "April 2026 · APEX-IB-01",
    ip: "82.66.41.19",
    result: "success",
  },
  {
    id: "log_10",
    at: "2026-05-24T21:33:11Z",
    actor: "Camille Roux",
    actorRole: "Compliance Officer",
    action: "Rotated API key",
    target: "apex-prod-#2",
    ip: "82.66.41.18",
    result: "success",
  },
];

/* -------------------------------------------------------------------------- */
/*  KPI series                                                                 */
/* -------------------------------------------------------------------------- */

export const VOLUME_SERIES_30D = [
  82, 88, 110, 105, 121, 145, 138, 155, 162, 158, 174, 185, 196, 188, 204, 219,
  214, 232, 248, 256, 244, 262, 281, 274, 290, 312, 304, 326, 348, 361,
];

export const NET_DEPOSIT_SERIES_30D = [
  18, 22, 26, 24, 31, 28, 35, 33, 41, 39, 48, 52, 56, 58, 62, 64, 71, 69, 78,
  82, 80, 86, 91, 89, 96, 102, 99, 108, 114, 121,
];

export const VOLUME_SERIES_12M = [
  3.2, 4.1, 4.8, 5.6, 6.9, 8.2, 9.4, 10.2, 11.4, 12.8, 13.9, 15.2,
];
export const NET_DEPOSIT_12M = [
  1.1, 1.3, 1.6, 1.8, 2.1, 2.4, 2.8, 3.1, 3.4, 3.8, 4.2, 4.7,
];

/* -------------------------------------------------------------------------- */
/*  KYC pipeline counters                                                      */
/* -------------------------------------------------------------------------- */

export const KYC_PIPELINE = {
  submitted_today: 18,
  pending: 24,
  under_review: 9,
  resubmit_required: 6,
  document_missing: 4,
  approved_today: 11,
  rejected_today: 2,
  compliance_hold: 3,
};

/* -------------------------------------------------------------------------- */
/*  Reconciliation                                                             */
/* -------------------------------------------------------------------------- */

export const RECONCILIATION = [
  {
    date: "2026-05-24",
    fpgDeposits: 1_842_400,
    apexDeposits: 1_842_400,
    fpgWithdrawals: 612_800,
    apexWithdrawals: 612_800,
    fpgVolumeLots: 12840.5,
    apexVolumeLots: 12840.5,
    delta: 0,
    status: "reconciled" as const,
  },
  {
    date: "2026-05-23",
    fpgDeposits: 980_200,
    apexDeposits: 980_200,
    fpgWithdrawals: 421_100,
    apexWithdrawals: 421_100,
    fpgVolumeLots: 9421.1,
    apexVolumeLots: 9421.1,
    delta: 0,
    status: "reconciled" as const,
  },
  {
    date: "2026-05-22",
    fpgDeposits: 1_240_800,
    apexDeposits: 1_240_800,
    fpgWithdrawals: 318_900,
    apexWithdrawals: 318_900,
    fpgVolumeLots: 10_120.2,
    apexVolumeLots: 10_120.2,
    delta: 0,
    status: "reconciled" as const,
  },
  {
    date: "2026-05-21",
    fpgDeposits: 1_810_500,
    apexDeposits: 1_810_500,
    fpgWithdrawals: 280_100,
    apexWithdrawals: 280_100,
    fpgVolumeLots: 11_840.6,
    apexVolumeLots: 11_840.6,
    delta: 0,
    status: "reconciled" as const,
  },
  {
    date: "2026-05-20",
    fpgDeposits: 1_485_200,
    apexDeposits: 1_485_200,
    fpgWithdrawals: 405_600,
    apexWithdrawals: 411_220,
    fpgVolumeLots: 10_240.8,
    apexVolumeLots: 10_240.8,
    delta: -5620,
    status: "delta" as const,
  },
  {
    date: "2026-05-19",
    fpgDeposits: 1_205_300,
    apexDeposits: 1_205_300,
    fpgWithdrawals: 380_800,
    apexWithdrawals: 380_800,
    fpgVolumeLots: 9844.4,
    apexVolumeLots: 9844.4,
    delta: 0,
    status: "reconciled" as const,
  },
  {
    date: "2026-05-18",
    fpgDeposits: 760_400,
    apexDeposits: 760_400,
    fpgWithdrawals: 219_800,
    apexWithdrawals: 219_800,
    fpgVolumeLots: 8120.1,
    apexVolumeLots: 8120.1,
    delta: 0,
    status: "reconciled" as const,
  },
];

/* -------------------------------------------------------------------------- */
/*  API keys                                                                   */
/* -------------------------------------------------------------------------- */

export type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  scopes: ("read" | "kyc.upload" | "accounts.create" | "payments.initiate" | "reporting")[];
  createdAt: string;
  lastUsed: string;
  ipAllowlist: string[];
  status: "active" | "rotated" | "revoked";
};

export const API_KEYS: ApiKey[] = [
  {
    id: "k_01",
    label: "Production · primary",
    prefix: "apex-prod-",
    scopes: ["read", "kyc.upload", "accounts.create", "payments.initiate", "reporting"],
    createdAt: "2026-01-10T09:00:00Z",
    lastUsed: "2026-05-25T08:12:48Z",
    ipAllowlist: ["10.42.7.91", "10.42.7.92"],
    status: "active",
  },
  {
    id: "k_02",
    label: "Production · backup",
    prefix: "apex-prod-",
    scopes: ["read", "reporting"],
    createdAt: "2026-04-02T11:14:00Z",
    lastUsed: "2026-05-24T18:30:14Z",
    ipAllowlist: ["10.42.7.91"],
    status: "rotated",
  },
  {
    id: "k_03",
    label: "Sandbox · integration",
    prefix: "apex-sbx-",
    scopes: ["read", "kyc.upload", "accounts.create", "payments.initiate", "reporting"],
    createdAt: "2026-02-19T13:00:00Z",
    lastUsed: "2026-05-25T07:50:11Z",
    ipAllowlist: ["10.42.7.93"],
    status: "active",
  },
];

/* -------------------------------------------------------------------------- */
/*  Team                                                                       */
/* -------------------------------------------------------------------------- */

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Compliance Officer" | "Operations" | "Finance" | "Support" | "Viewer";
  status: "active" | "suspended" | "invited";
  lastSeen: string;
  twoFA: boolean;
};

export const TEAM: TeamMember[] = [
  {
    id: "t_01",
    name: "Ariane Martin",
    email: "ariane.m@apex-ops.com",
    role: "Admin",
    status: "active",
    lastSeen: "2026-05-25T07:12:14Z",
    twoFA: true,
  },
  {
    id: "t_02",
    name: "Camille Roux",
    email: "camille.r@apex-ops.com",
    role: "Compliance Officer",
    status: "active",
    lastSeen: "2026-05-25T08:55:14Z",
    twoFA: true,
  },
  {
    id: "t_03",
    name: "Hannah Weber",
    email: "hannah.w@apex-ops.com",
    role: "Operations",
    status: "active",
    lastSeen: "2026-05-25T08:30:01Z",
    twoFA: true,
  },
  {
    id: "t_04",
    name: "Marc Lefevre",
    email: "marc.l@apex-ops.com",
    role: "Finance",
    status: "active",
    lastSeen: "2026-05-24T22:14:00Z",
    twoFA: true,
  },
  {
    id: "t_05",
    name: "Théo Garcia",
    email: "theo.g@apex-ops.com",
    role: "Support",
    status: "active",
    lastSeen: "2026-05-25T07:32:14Z",
    twoFA: false,
  },
  {
    id: "t_06",
    name: "Inès Dubois",
    email: "ines.d@apex-ops.com",
    role: "Viewer",
    status: "invited",
    lastSeen: "—",
    twoFA: false,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers (re-exported from lib/format for backwards compatibility)         */
/* -------------------------------------------------------------------------- */

export { fmtMoney, fmtNumber, fmtDate } from "./format";
