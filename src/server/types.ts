/**
 * Canonical entity types for the APEX powered by FPG demo.
 *
 * Every entity that exists on the FPG side keeps both identifiers:
 *   - apexId / apexCorrelationId   (originator on APEX)
 *   - fpgId / fpgClientId          (canonical on FPG)
 *
 * This is required by §5.1 of the cahier des charges:
 *   "Mapping client APEX - client FPG obligatoire".
 */

/* -------------------------------------------------------------------------- */
/*  Clients                                                                    */
/* -------------------------------------------------------------------------- */

export type ClientStatus =
  | "draft"
  | "pending_kyc"
  | "approved"
  | "rejected"
  | "suspended"
  | "closed";

export type KycStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "resubmit_required"
  | "document_missing"
  | "compliance_hold"
  | "enhanced_due_diligence";

export type ClientType = "Retail" | "Pro" | "Corporate";

export interface ConsentRecord {
  document: string;
  version: string;
  acceptedAt: string;
  ip: string;
  userAgent: string;
}

export interface SuitabilityAnswers {
  experience: "none" | "lt1y" | "1to2y" | "3to5y" | "gt5y";
  riskTolerance: "conservative" | "balanced" | "growth" | "aggressive";
  netWorth: "lt50k" | "50k_250k" | "250k_1m" | "gt1m";
  objective: "preservation" | "income" | "growth" | "speculation";
  filledAt: string;
}

export interface Client {
  id: string; // internal db id
  apexId: string; // APX-…
  fpgId: string | null; // FPG-… (null until FPG client creation acks)
  type: ClientType;
  status: ClientStatus;
  kyc: KycStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  countryOfResidence: string;
  countryOfTaxResidence: string;
  isUsPerson: boolean;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  language: "EN" | "FR" | "DE" | "ES" | "IT" | "JA";
  ibCode: string;
  registrationSource: "APEX_PORTAL";
  registrationIp: string;
  userAgent: string;
  consents: ConsentRecord[];
  suitability: SuitabilityAnswers | null;
  passwordHash: string;
  passwordSalt: string;
  totpSecret: string | null;
  // Read-only derived metrics (kept current by services)
  totalDeposits: number;
  netDeposit: number;
  volume30d: number;
  accountsCount: number;
  // Audit
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  marketingSource: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referral?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  KYC documents                                                              */
/* -------------------------------------------------------------------------- */

export type DocumentKind =
  | "id_front"
  | "id_back"
  | "passport"
  | "selfie"
  | "proof_of_address"
  | "source_of_funds"
  | "incorporation_certificate"
  | "ubo_register"
  | "directors_register"
  | "board_resolution";

export type DocumentStatus =
  | "uploaded"
  | "under_review"
  | "verified"
  | "rejected";

export interface KycDocument {
  id: string; // doc_…
  clientApexId: string;
  clientFpgId: string | null;
  kind: DocumentKind;
  filename: string;
  mime: string;
  bytes: number;
  sha256: string;
  status: DocumentStatus;
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  // Truncated content for the demo (≤ 4096 bytes). Real impl stores in S3-style bucket.
  contentBase64Truncated?: string;
}

/* -------------------------------------------------------------------------- */
/*  Trading accounts                                                           */
/* -------------------------------------------------------------------------- */

export type Platform = "MT4" | "MT5";
export type AccountMode = "Live" | "Demo";
export type AccountType = "Standard" | "Pro" | "Raw" | "ECN" | "Islamic";
export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "AUD";
export type AccountStatus = "active" | "inactive" | "suspended" | "restricted" | "closed";
export type FpgServer = "FPG-Live-01" | "FPG-Live-02" | "FPG-Live-03" | "FPG-Demo-01";

export interface TradingAccount {
  id: string;
  login: string; // FPG{n}-L1 etc.
  clientApexId: string;
  clientFpgId: string;
  platform: Platform;
  mode: AccountMode;
  accountType: AccountType;
  server: FpgServer;
  currency: Currency;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  status: AccountStatus;
  restrictionReason?: string;
  openedAt: string;
  closedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Trades                                                                     */
/* -------------------------------------------------------------------------- */

export type Side = "Buy" | "Sell";

export interface Trade {
  id: string;
  ticket: string;
  accountLogin: string;
  clientApexId: string;
  symbol: string;
  side: Side;
  lots: number;
  openTime: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  commission: number;
  swap: number;
  pnl: number;
}

export interface OpenPosition {
  ticket: string;
  accountLogin: string;
  symbol: string;
  side: Side;
  lots: number;
  openTime: string;
  openPrice: number;
  currentPrice: number;
  pnl: number;
}

/* -------------------------------------------------------------------------- */
/*  Deposits / Withdrawals                                                     */
/* -------------------------------------------------------------------------- */

export type DepositMethod =
  | "Visa / Mastercard"
  | "Bank transfer"
  | "USDT (TRC20)"
  | "USDT (ERC20)"
  | "Skrill"
  | "Neteller";

export type Psp = "Apex-PSP-FPG" | "FPG-Crypto-Gateway" | "FPG-Bank-Rails";

export type DepositStatus =
  | "initiated"
  | "pending"
  | "completed"
  | "failed"
  | "rejected"
  | "chargeback"
  | "refunded";

export interface DepositSession {
  id: string; // dp_…
  fpgTxnId: string; // FPG-DEP-…
  clientApexId: string;
  clientFpgId: string;
  accountLogin: string;
  amount: number;
  currency: Currency;
  method: DepositMethod;
  psp: Psp;
  hostedUrl: string; // points to /fpg-psp-mock/[id]
  status: DepositStatus;
  fees: number;
  apexCorrelationId: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export type WithdrawalStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "failed";

export interface Withdrawal {
  id: string; // wd_…
  fpgTxnId?: string;
  clientApexId: string;
  clientFpgId: string;
  accountLogin: string;
  method: string;
  amount: number;
  currency: Currency;
  status: WithdrawalStatus;
  rejectionReason?: string;
  apexCorrelationId: string;
  destinationMasked: string; // "Visa **** 4421"
  createdAt: string;
  updatedAt: string;
  reviewerId?: string;
}

/* -------------------------------------------------------------------------- */
/*  IB volumes, commissions, statements                                        */
/* -------------------------------------------------------------------------- */

export interface IbVolumeRow {
  id: string;
  date: string; // YYYY-MM-DD
  ibCode: string;
  clientApexId: string;
  accountLogin: string;
  symbol: string;
  side: Side;
  lots: number;
  notional: number; // in USD
  trades: number;
}

export type CommissionEntryType = "trade" | "scalping_excluded" | "client_excluded" | "chargeback" | "rebate";

export interface CommissionEntry {
  id: string;
  date: string;
  ibCode: string;
  clientApexId?: string;
  accountLogin?: string;
  symbol?: string;
  lots: number;
  rateUsdPerLot: number;
  amount: number; // signed (negative for adjustments)
  type: CommissionEntryType;
  reason?: string;
}

export type StatementStatus = "draft" | "pending" | "paid";

export interface MonthlyStatement {
  id: string;
  ibCode: string;
  period: string; // YYYY-MM
  grossAmount: number;
  adjustmentsAmount: number;
  netPayable: number;
  lots: number;
  rateAverage: number;
  generatedAt: string;
  dueDate: string;
  status: StatementStatus;
  paidAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Reconciliation                                                             */
/* -------------------------------------------------------------------------- */

export type ReconciliationRowStatus = "reconciled" | "delta";

export interface ReconciliationRow {
  date: string;
  fpgDeposits: number;
  apexDeposits: number;
  fpgWithdrawals: number;
  apexWithdrawals: number;
  fpgVolumeLots: number;
  apexVolumeLots: number;
  delta: number;
  status: ReconciliationRowStatus;
  note?: string;
}

/* -------------------------------------------------------------------------- */
/*  Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

export type WebhookEventType =
  // KYC
  | "kyc_submitted" | "kyc_approved" | "kyc_rejected"
  | "kyc_resubmit_required" | "document_missing" | "compliance_hold"
  // Client
  | "client_created" | "client_updated" | "client_suspended" | "client_closed"
  // Trading account
  | "trading_account_created" | "trading_account_updated"
  | "trading_account_disabled" | "leverage_changed" | "password_reset_requested"
  // Deposit
  | "deposit_created" | "deposit_pending" | "deposit_completed"
  | "deposit_failed" | "deposit_rejected" | "deposit_chargeback" | "deposit_refund"
  // Withdrawal
  | "withdrawal_requested" | "withdrawal_under_review" | "withdrawal_approved"
  | "withdrawal_processing" | "withdrawal_completed" | "withdrawal_rejected" | "withdrawal_failed"
  // Trading / volume
  | "trade_closed" | "daily_volume_ready" | "volume_report_ready" | "account_status_changed"
  // Commission
  | "commission_generated" | "commission_adjusted" | "commission_paid" | "monthly_statement_ready"
  // Technical
  | "api_error" | "webhook_retry" | "reconciliation_report_ready"
  | "incident_opened" | "incident_resolved";

export type WebhookDeliveryStatus = "pending" | "delivered" | "retry" | "dropped";

export interface WebhookEvent {
  id: string;
  eventId: string; // evt_…
  type: WebhookEventType;
  payload: Record<string, unknown>;
  clientApexId?: string;
  clientFpgId?: string;
  createdAt: string;
  // Delivery
  status: WebhookDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  signature: string; // sha256=…
  durationMs?: number;
  responseStatus?: number;
}

/* -------------------------------------------------------------------------- */
/*  Sessions, team, api keys                                                   */
/* -------------------------------------------------------------------------- */

export type SessionKind = "admin" | "client";

export interface Session {
  id: string; // sess_…
  kind: SessionKind;
  refId: string; // teamMember.id or client.id
  twoFactorVerified: boolean;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  ip: string;
  userAgent: string;
}

export type TeamRole = "Admin" | "Compliance Officer" | "Operations" | "Finance" | "Support" | "Viewer";

export type TeamMemberStatus = "active" | "suspended" | "invited";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  passwordHash: string;
  passwordSalt: string;
  totpSecret: string;
  twoFAEnforced: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  ip?: string;
}

export type ApiKeyScope =
  | "read"
  | "kyc.upload"
  | "accounts.create"
  | "payments.initiate"
  | "reporting"
  | "webhooks.replay";

export type ApiKeyStatus = "active" | "rotated" | "revoked";

export interface ApiKey {
  id: string;
  label: string;
  prefix: string; // apex-prod-, apex-sbx-
  hashedKey: string; // sha256 of full key
  lastUsed: string | null;
  ipAllowlist: string[];
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  createdAt: string;
  createdBy: string;
  rotatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  FPG tokens (OAuth2 grant)                                                  */
/* -------------------------------------------------------------------------- */

export interface FpgToken {
  accessToken: string;
  clientId: string;
  scopes: ApiKeyScope[];
  issuedAt: string;
  expiresAt: string;
  ip?: string;
}

/* -------------------------------------------------------------------------- */
/*  Idempotency                                                                */
/* -------------------------------------------------------------------------- */

export interface IdempotencyRecord {
  key: string;
  bodyHash: string;
  responseBody: unknown;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  createdAt: string;
  expiresAt: string; // 24h
  endpoint: string;
}

/* -------------------------------------------------------------------------- */
/*  Audit log                                                                  */
/* -------------------------------------------------------------------------- */

export type AuditResult = "success" | "failure";

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  target?: string;
  ip: string;
  userAgent?: string;
  result: AuditResult;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*  Config + state                                                             */
/* -------------------------------------------------------------------------- */

export interface ServerConfig {
  apexWebhookUrl: string;
  fpgWebhookUrl: string; // for incoming webhook events from FPG (in real life)
  webhookDispatchDelayMs: number; // simulated delay between event creation and delivery
  rateLimitsEnabled: boolean;
  signatureVerificationEnabled: boolean;
  persistEnabled: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Aggregated Database shape                                                  */
/* -------------------------------------------------------------------------- */

export interface DatabaseShape {
  clients: Client[];
  tradingAccounts: TradingAccount[];
  trades: Trade[];
  openPositions: OpenPosition[];
  kycDocuments: KycDocument[];
  deposits: DepositSession[];
  withdrawals: Withdrawal[];
  ibVolumes: IbVolumeRow[];
  commissions: CommissionEntry[];
  statements: MonthlyStatement[];
  reconciliation: ReconciliationRow[];
  webhookEvents: WebhookEvent[];
  sessions: Session[];
  teamMembers: TeamMember[];
  apiKeys: ApiKey[];
  fpgTokens: FpgToken[];
  idempotency: IdempotencyRecord[];
  auditLog: AuditEntry[];
  config: ServerConfig;
}
