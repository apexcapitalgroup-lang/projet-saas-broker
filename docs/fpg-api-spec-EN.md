# APEX powered by FPG — FPG API Specification (English)

**Version 1.0 · 25 May 2026**
**Audience: FPG engineering, operations, compliance and payments teams.**

This document specifies the API surface that FPG must expose so APEX can deliver
the full client experience while FPG remains the regulated broker.

Every endpoint below has an existing reference implementation in this codebase
(`/api/fpg/v1/...`). FPG can run the reference, replay our request/response
shapes, and copy the contract one-to-one when implementing on FPG infrastructure.

---

## 1 · Table of contents

1. [Overview & principles](#1-overview)
2. [Authentication & scopes](#2-authentication--scopes)
3. [Idempotency](#3-idempotency)
4. [Response signing](#4-response-signing)
5. [Error envelope](#5-error-envelope)
6. [Rate limiting](#6-rate-limiting)
7. [Endpoints — Clients](#7-endpoints--clients)
8. [Endpoints — KYC](#8-endpoints--kyc)
9. [Endpoints — Trading accounts](#9-endpoints--trading-accounts)
10. [Endpoints — Deposits](#10-endpoints--deposits)
11. [Endpoints — Withdrawals](#11-endpoints--withdrawals)
12. [Endpoints — Trading history](#12-endpoints--trading-history)
13. [Endpoints — IB volumes, commissions, reconciliation](#13-endpoints--ib)
14. [Webhooks](#14-webhooks)
15. [Sandbox & production](#15-sandbox--production)
16. [Glossary](#16-glossary)

---

## 1 · Overview

**Operating model.** APEX is the front-office and operations layer. FPG is the
broker of record, holding the regulatory client relationship, custodying funds,
running MT4/MT5, executing trades, and approving KYC and withdrawals. APEX
never receives, holds or moves client funds.

**Identifier mapping.** Every entity carries both identifiers:

| Field                | Owner | Format       | Example          |
|----------------------|-------|--------------|------------------|
| `apex_correlation_id`| APEX  | `APX-NNNNNN` | `APX-100482`     |
| `fpg_client_id`      | FPG   | `FPG-NNNNNN` | `FPG-7740921`    |
| `apex_correlation_id`| APEX  | `apex-<...>` | `apex-dep-7e2c4a`|
| `fpg_txn_id`         | FPG   | `FPG-<...>`  | `FPG-DEP-A8412`  |

The mapping is enforced from the very first request (`POST /v1/clients` carries
`apex_correlation_id` and returns `fpg_client_id`).

**Base URLs.**

| Environment | Base URL (proposed)                                    |
|-------------|--------------------------------------------------------|
| Sandbox     | `https://sandbox-api.fortuneprime.com/v1`              |
| Production  | `https://api.fortuneprime.com/v1`                      |
| Demo (here) | `http://localhost:3000/api/fpg/v1`                     |

**Content type.** Requests and responses are `application/json; charset=utf-8`,
except `POST /oauth/token` which also accepts `application/x-www-form-urlencoded`.

---

## 2 · Authentication & scopes

### 2.1 OAuth2 client_credentials grant

```
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "apex_demo",
  "client_secret": "apex_demo_secret_change_in_prod",
  "scope": "read kyc.upload accounts.create payments.initiate reporting webhooks.replay"
}
```

Response (200):

```json
{
  "access_token": "fpg_NESN1V2HMZ2BS99W",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "read kyc.upload accounts.create payments.initiate reporting webhooks.replay"
}
```

Tokens are valid 24 hours. All subsequent calls must include:

```
Authorization: Bearer <access_token>
```

### 2.2 Scopes

| Scope                 | Allows                                                |
|-----------------------|-------------------------------------------------------|
| `read`                | All GET endpoints                                     |
| `kyc.upload`          | KYC documents upload + status read                    |
| `accounts.create`     | Create/update clients, trading accounts, leverage     |
| `payments.initiate`   | Create deposit sessions and withdrawals               |
| `reporting`           | Volumes, commissions, statements, reconciliation      |
| `webhooks.replay`     | Trigger manual webhook replays                        |

A request missing a required scope returns **403 `fpg.scope_insufficient`**.

### 2.3 IP allow-listing

FPG production allow-lists the static APEX egress IP pair (provided
out-of-band). Requests from any other IP return **403 `fpg.ip_not_allowed`**.

### 2.4 Key rotation

API client secrets are rotated every 90 days by default. Both keys (old + new)
are accepted for a 7-day overlap window during rotation.

---

## 3 · Idempotency

All state-changing requests (`POST`, `PATCH`, `DELETE`) **must** include:

```
Idempotency-Key: <opaque-string-up-to-128-chars>
```

A missing key returns **400 `fpg.idempotency_key_required`**.

Behaviour:

* **First call** → request processed, response cached for 24 hours.
* **Identical replay** (same key, same body, same endpoint) → cached response,
  same HTTP status, plus header `x-fpg-idempotent-replay: true`.
* **Body mismatch** (same key, different body) →
  **409 `fpg.idempotency_mismatch`**.
* **Endpoint mismatch** (same key, different endpoint) →
  **409 `fpg.idempotency_endpoint_mismatch`**.

Use UUIDs or correlation ids. We recommend the APEX correlation id pattern:
`apex-dep-7e2c4a`, `apex-wd-9114ce`.

---

## 4 · Response signing

Every JSON response includes:

```
X-FPG-Signature: t=1716628800, v1=4e2c7ab09d0a3fbe8…
X-FPG-Api-Version: 1.0
X-Request-Id: req-0tpj413f4p43
```

Algorithm:

```
v1 = HMAC_SHA256(signing_secret, `${t}.${request_id}.${response_body_raw}`)
```

`t` is the Unix timestamp in seconds at signing time. Clients should reject
responses where `|now - t| > 300 seconds`.

The same algorithm is used to sign **webhook** payloads (see §14).

---

## 5 · Error envelope

All errors share:

```json
{
  "error": {
    "code": "fpg.<domain>.<reason>",
    "message": "Human-readable explanation",
    "field": "deposits.amount",
    "details": { "free_margin": 12000 }
  },
  "request_id": "req-0tpj413f4p43"
}
```

Common codes:

| HTTP | Code                              | Meaning                                   |
|------|-----------------------------------|-------------------------------------------|
| 400  | `request.invalid_json`            | Body is not valid JSON                    |
| 400  | `fpg.idempotency_key_required`    | Missing Idempotency-Key                   |
| 401  | `fpg.missing_bearer`              | Missing Authorization                     |
| 401  | `fpg.invalid_token`               | Bearer token unknown                      |
| 401  | `fpg.token_expired`               | Bearer token expired                      |
| 401  | `webhook.signature_mismatch`      | Webhook signature invalid                 |
| 403  | `fpg.scope_insufficient`          | Token lacks required scope                |
| 403  | `fpg.ip_not_allowed`              | Calling IP not in allow-list              |
| 404  | `fpg.client_not_found`            | Unknown client                            |
| 404  | `fpg.account_not_found`           | Unknown trading account                   |
| 409  | `fpg.idempotency_mismatch`        | Idempotency-Key replayed with diff body   |
| 409  | `fpg.client_already_exists`       | Apex correlation id has FPG mapping       |
| 422  | `fpg.validation`                  | Body schema invalid                       |
| 422  | `fpg.kyc_not_approved`            | KYC must be approved for operation        |
| 422  | `fpg.kyc_invalid_transition`      | Forbidden KYC state transition            |
| 422  | `fpg.withdrawal_invalid_transition` | Forbidden withdrawal state transition   |
| 422  | `fpg.aml.method_mismatch`         | Withdrawal violates same-source AML rule  |
| 422  | `fpg.leverage_above_jurisdiction_cap` | Leverage exceeds jurisdiction cap    |
| 422  | `fpg.insufficient_free_margin`    | Withdrawal exceeds free margin            |
| 429  | `fpg.rate_limited`                | Rate limit hit (see Retry-After)          |
| 500  | `fpg.internal`                    | Internal error                            |

---

## 6 · Rate limiting

Each `client_id` has a token bucket: **60 requests / second** burst,
**1000 / minute** sustained.

Every response carries:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 994
X-RateLimit-Reset: 1716628890
```

`429` responses include `Retry-After: <seconds>`. Apply exponential back-off.

---

## 7 · Endpoints — Clients

### 7.1 `POST /v1/clients` — Create client

**Scope:** `accounts.create`. **Idempotency-Key required.**

Request body:

```json
{
  "apex_correlation_id": "APX-100501",
  "type": "Retail",
  "first_name": "Sebastian",
  "last_name": "Lindqvist",
  "email": "s.lindqvist@northforest.io",
  "phone": "+46 70 123 45 67",
  "date_of_birth": "1989-04-12",
  "nationality": "Sweden",
  "country_of_residence": "Sweden",
  "country_of_tax_residence": "Sweden",
  "is_us_person": false,
  "address": { "street": "Drottninggatan 12", "city": "Stockholm", "postal_code": "111 51" },
  "language": "EN",
  "ib_code": "APEX-IB-01",
  "registration_source": "APEX_PORTAL",
  "registration_ip": "82.66.41.18",
  "user_agent": "Mozilla/5.0 (Macintosh; …)",
  "consents": [
    { "document": "FPG T&C", "version": "v4.2", "accepted_at": "2026-04-12T09:14:00Z", "ip": "82.66.41.18" },
    { "document": "Risk disclosure", "version": "v3.1", "accepted_at": "2026-04-12T09:14:00Z", "ip": "82.66.41.18" }
  ],
  "marketing_source": { "utm_source": "newsletter", "utm_campaign": "04-2026" }
}
```

Response (201):

```json
{
  "client": {
    "fpg_client_id": "FPG-7742236",
    "apex_correlation_id": "APX-100501",
    "type": "Retail",
    "status": "pending_kyc",
    "kyc_status": "pending",
    "first_name": "Sebastian",
    "last_name": "Lindqvist",
    "email": "s.lindqvist@northforest.io",
    "country_of_residence": "Sweden",
    "ib_code": "APEX-IB-01",
    "created_at": "2026-05-25T09:00:00Z",
    "updated_at": "2026-05-25T09:00:00Z"
  }
}
```

Emits webhook `client_created`.

### 7.2 `GET /v1/clients`

**Scope:** `read`.

Query: `page`, `page_size`, `apex_correlation_id`, `email`, `status`, `kyc_status`, `ib_code`.
Returns `{ items: [...], page, page_size, total }`.

### 7.3 `GET /v1/clients/{id}` — Retrieve

`{id}` can be either `apex_correlation_id` or `fpg_client_id`.

### 7.4 `PATCH /v1/clients/{id}` — Update

**Idempotency-Key required.** Updatable fields: `phone`, `email`, `address`,
`language`, `suitability`.

---

## 8 · Endpoints — KYC

### 8.1 `POST /v1/clients/{id}/kyc/documents` — Upload

**Scope:** `kyc.upload`. **Idempotency-Key required.**

```json
{
  "kind": "passport",
  "filename": "passport_lindqvist.pdf",
  "mime": "application/pdf",
  "bytes": 1247201,
  "content_base64": "JVBERi0xLjcKJcfsj6IK…"
}
```

Document `kind`s: `id_front`, `id_back`, `passport`, `selfie`, `proof_of_address`,
`source_of_funds`, plus KYB variants `incorporation_certificate`, `ubo_register`,
`directors_register`, `board_resolution`.

Side effect: once a client has uploaded ≥ 2 documents while pending, KYC status
auto-transitions to `under_review` and emits `kyc_submitted` (or first upload
emits `kyc_submitted` directly).

### 8.2 `GET /v1/clients/{id}/kyc/documents`

Lists all uploaded documents with their status.

### 8.3 `GET /v1/clients/{id}/kyc/status`

```json
{
  "client_apex_id": "APX-100501",
  "client_fpg_id": "FPG-7742236",
  "status": "under_review",
  "documents_count": 4,
  "documents": [
    { "kind": "passport", "status": "verified" },
    { "kind": "proof_of_address", "status": "rejected", "rejection_reason": "Older than 90 days" }
  ],
  "suitability": null
}
```

Statuses: `pending`, `under_review`, `approved`, `rejected`, `resubmit_required`,
`document_missing`, `compliance_hold`, `enhanced_due_diligence`.

### 8.4 `PATCH /v1/clients/{id}/kyc/status` — Decision

**Scope:** `kyc.upload`. FPG internal. Body: `{ status, reason?, document?, next_step? }`.

Emits one of: `kyc_approved`, `kyc_rejected`, `kyc_resubmit_required`,
`document_missing`, `compliance_hold`.

State machine:

```
pending          → under_review | document_missing | compliance_hold | approved | rejected
under_review     → approved | rejected | resubmit_required | compliance_hold | enhanced_due_diligence
approved         → enhanced_due_diligence | compliance_hold | rejected
rejected         → resubmit_required
resubmit_required → under_review | rejected
document_missing → under_review | rejected
compliance_hold  → approved | rejected | enhanced_due_diligence
enhanced_due_diligence → approved | rejected | compliance_hold
```

---

## 9 · Endpoints — Trading accounts

### 9.1 `POST /v1/clients/{id}/trading-accounts` — Create

**Scope:** `accounts.create`. **Idempotency-Key required.**

```json
{ "platform": "MT5", "mode": "Live", "account_type": "Raw",
  "currency": "USD", "leverage": 200 }
```

Response (201):

```json
{
  "account": {
    "account_id": "ta_xxx",
    "login": "FPG7740921-L2",
    "client_apex_id": "APX-100482",
    "client_fpg_id": "FPG-7740921",
    "platform": "MT5", "mode": "Live", "account_type": "Raw",
    "server": "FPG-Live-02", "currency": "USD", "leverage": 200,
    "balance": 0, "equity": 0, "margin": 0, "free_margin": 0,
    "status": "active",
    "opened_at": "2026-05-25T09:00:00Z"
  },
  "password_reset_url": "/v1/trading-accounts/FPG7740921-L2/password-reset"
}
```

Notes:

* `Live` requires `kyc_status: approved` (or `enhanced_due_diligence`).
* Maximum 5 accounts per client.
* Servers are chosen by client residence: APAC → `FPG-Live-03`, others
  round-robin on `FPG-Live-01/02`, demo → `FPG-Demo-01`.
* Emits `trading_account_created`.
* The trading password is **never** returned in clear. Initial password
  delivery flows through `POST /v1/trading-accounts/{login}/password-reset`.

### 9.2 `GET /v1/clients/{id}/trading-accounts`

Lists the client's accounts.

### 9.3 `GET /v1/trading-accounts/{login}/summary`

Real-time mirror of balance / equity / margin / free margin / open PnL.

### 9.4 `PATCH /v1/trading-accounts/{login}/leverage`

**Idempotency-Key required.** Body: `{ "leverage": 100 }`. Enforces
jurisdiction caps (e.g. EU residents capped at 30:1). Emits `leverage_changed`.

### 9.5 `POST /v1/trading-accounts/{login}/password-reset`

Generates an ephemeral ticket. FPG emails the client a one-time URL. Emits
`password_reset_requested`.

---

## 10 · Endpoints — Deposits

### 10.1 `GET /v1/deposit-methods`

```
GET /v1/deposit-methods?country=Sweden&currency=USD&amount=5000
```

Returns the list of methods available for that context, including PSP routing,
min/max amounts, fee percentage, and processing time.

### 10.2 `POST /v1/deposits/sessions` — Hosted payment

**Scope:** `payments.initiate`. **Idempotency-Key required.**

```json
{
  "apex_correlation_id": "apex-dep-7e2c4a",
  "client_fpg_id": "FPG-7740921",
  "trading_account_login": "FPG7740921-L1",
  "amount": 5000,
  "currency": "USD",
  "method_key": "visa_mc",
  "return_url": "https://apex.com/portal/transactions?dep=…",
  "webhook_url": "https://api.apex.com/internal/webhooks/fpg"
}
```

Response (201):

```json
{
  "deposit": {
    "deposit_id": "dp_…",
    "fpg_txn_id": "FPG-DEP-…",
    "status": "initiated",
    "hosted_url": "https://psp.fortuneprime.com/checkout/dp_…",
    "amount": 5000,
    "currency": "USD",
    "fees": 75,
    "apex_correlation_id": "apex-dep-7e2c4a"
  },
  "next_action": { "type": "redirect_to_hosted_url", "url": "https://psp…" }
}
```

The client browser is redirected to `hosted_url`. The PSP page is operated by
FPG; APEX **never** sees card data. FPG sends webhook events as the session
progresses (`deposit_pending`, `deposit_completed`, `deposit_failed`,
`deposit_chargeback`, `deposit_refund`).

### 10.3 `GET /v1/deposits/{id}`

`{id}` may be `deposit_id`, `fpg_txn_id`, or `apex_correlation_id`.

---

## 11 · Endpoints — Withdrawals

### 11.1 `POST /v1/withdrawals` — Request

**Scope:** `payments.initiate`. **Idempotency-Key required.**

```json
{
  "apex_correlation_id": "apex-wd-9114ce",
  "trading_account_login": "FPG7740921-L1",
  "amount": 4000,
  "currency": "USD",
  "method": "bank_transfer_swift",
  "destination_masked": "SWIFT · IBAN **** 4821"
}
```

Validations: KYC approved, amount ≤ free margin, same-source rule on
`visa_mc_refund`.

Emits `withdrawal_requested` then `withdrawal_under_review` after ~1.5 s.

### 11.2 `PATCH /v1/withdrawals/{id}` — Decision (FPG internal)

```json
{ "decision": "approve" | "reject" | "processing" | "complete" | "fail",
  "reason": "AML — source of funds documentation required" }
```

State machine:

```
requested      → under_review | approved | rejected
under_review   → approved | rejected
approved       → processing | rejected
processing     → completed | failed
completed | rejected | failed → (terminal)
```

Emits the corresponding webhook event.

### 11.3 `GET /v1/withdrawals` & `GET /v1/withdrawals/{id}`

Standard list and retrieve.

---

## 12 · Endpoints — Trading history

### 12.1 `GET /v1/clients/{id}/trades`

**Scope:** `read` or `reporting`.

Query: `from`, `to`, `symbol`, `account_login`, `page`, `page_size`.

Returns paginated closed trades: ticket, symbol, side, lots, open/close times
and prices, commission, swap, PnL.

---

## 13 · Endpoints — IB

### 13.1 `GET /v1/ib/APEX/volumes`

**Scope:** `reporting`.

Query: `from`, `to`, `group_by` (`day | symbol | client | account`),
`client_id`, `symbol`.

Returns aggregates: `{ items: [{day, lots, notional_usd, trades}], totals }`.

### 13.2 `GET /v1/ib/APEX/commissions`

Returns commission entries (trades + adjustments: scalping exclusion, excluded
clients, chargebacks, rebates) with daily granularity, plus totals
(`gross`, `adjustments`, `net_payable`).

### 13.3 `GET /v1/ib/APEX/statements`

Lists monthly IB statements with `gross_amount`, `adjustments`, `net_payable`,
`lots`, `rate_average`, `generated_at`, `due_date`, `status`, `paid_at`,
`download_url`.

### 13.4 `GET /v1/ib/APEX/reconciliation`

Daily reconciliation rows comparing APEX vs FPG ledgers
(deposits, withdrawals, volume in lots). `delta_usd` non-zero → row flagged
`status: delta`.

### 13.5 Revenue formula (May 2026)

```
net_payable = eligible_lots × rate_usd_per_lot − adjustments
```

* `eligible_lots = total_lots − scalping_lots − excluded_client_lots`
* Excluded: trades held < 60 seconds (scalping detected by FPG)
* Excluded clients: any client under `compliance_hold` for the month
* Cut-off: last UTC trading day of the month
* Settlement: net 15 days, USD wire

---

## 14 · Webhooks

FPG sends signed POSTs to the APEX endpoint:

```
POST https://api.apex.com/v1/webhooks/fpg
X-FPG-Signature: t=1716628800, v1=4e2c7ab09d0a3fbe8…
X-FPG-Event-Id: evt_01HXY8K2Q7N…
X-FPG-Event-Type: deposit_completed
Content-Type: application/json

{
  "id": "evt_01HXY8K2Q7N…",
  "type": "deposit_completed",
  "created_at": "2026-05-25T07:14:32Z",
  "client_apex_id": "APX-100482",
  "client_fpg_id": "FPG-7740921",
  "data": {
    "deposit_id": "dp_xxx",
    "fpg_txn_id": "FPG-DEP-A8412",
    "amount": 25000,
    "currency": "USD",
    "method": "Visa / Mastercard"
  }
}
```

### 14.1 Signature

```
v1 = HMAC_SHA256(webhook_secret, `${t}.${event_id}.${raw_body}`)
```

Reject if signature mismatch, malformed, or `|now − t| > 300 seconds`.

### 14.2 Idempotency on the receiver

APEX deduplicates by `event_id`. A repeated `event_id` returns `200 OK` with
`{ "status": "duplicate" }`.

### 14.3 Retry policy

| Attempt | Delay after previous |
|---------|----------------------|
| 1       | immediate            |
| 2       | 30 s                 |
| 3       | 2 min                |
| 4       | 10 min               |
| 5       | 1 h                  |
| 6       | 8 h                  |

After 6 attempts the event is `dropped` and an `incident_opened` event is
emitted internally. Manual replay is available via
`POST /v1/webhooks/{event_id}/replay` (scope `webhooks.replay`).

### 14.4 Event taxonomy

| Category         | Events                                                                 |
|------------------|------------------------------------------------------------------------|
| KYC              | `kyc_submitted`, `kyc_approved`, `kyc_rejected`, `kyc_resubmit_required`, `document_missing`, `compliance_hold` |
| Client           | `client_created`, `client_updated`, `client_suspended`, `client_closed`|
| Trading account  | `trading_account_created`, `trading_account_updated`, `trading_account_disabled`, `leverage_changed`, `password_reset_requested` |
| Deposit          | `deposit_created`, `deposit_pending`, `deposit_completed`, `deposit_failed`, `deposit_rejected`, `deposit_chargeback`, `deposit_refund` |
| Withdrawal       | `withdrawal_requested`, `withdrawal_under_review`, `withdrawal_approved`, `withdrawal_processing`, `withdrawal_completed`, `withdrawal_rejected`, `withdrawal_failed` |
| Trading          | `trade_closed`, `daily_volume_ready`, `volume_report_ready`, `account_status_changed` |
| Commission       | `commission_generated`, `commission_adjusted`, `commission_paid`, `monthly_statement_ready` |
| Technical        | `api_error`, `webhook_retry`, `reconciliation_report_ready`, `incident_opened`, `incident_resolved` |

---

## 15 · Sandbox & production

| Item                            | Sandbox                              | Production                       |
|---------------------------------|--------------------------------------|----------------------------------|
| Base URL                        | `https://sandbox-api.fortuneprime.com/v1` | `https://api.fortuneprime.com/v1` |
| Client credentials              | `apex_sandbox`, `apex_sandbox_secret`| Issued by FPG ops                |
| Webhook secret                  | `whsec_sbx_…`                        | `whsec_prod_…`                   |
| Test client                     | APX-700001 / s.lindqvist+demo@…      | n/a                              |
| Test cards                      | 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline) | n/a |
| Test crypto wallet              | `TXY…` (auto-funded on POST)         | n/a                              |
| Documentation refresh           | Daily                                | On change                        |
| SLA                             | best effort                          | 99.9% uptime, p95 < 500 ms       |
| Status page                     | `status.fortuneprime.com/sandbox`    | `status.fortuneprime.com`        |

---

## 16 · Glossary

* **APEX correlation id** — APEX-generated id for a request or entity. Used as
  the Idempotency-Key in many POSTs. Always echoed in responses and webhooks.
* **FPG id** — Canonical id assigned by FPG. APEX stores them but never
  generates them.
* **Hosted payment** — Payment session where the client interacts directly with
  the FPG-operated PSP page. APEX redirects the browser and never sees card data.
* **Free margin** — Equity minus margin used. Upper bound for withdrawals.
* **IB code** — Introducing-broker partner code. APEX's code is `APEX-IB-01`.

---

**Document owner:** APEX engineering. **Last update:** 2026-05-25.
**Feedback:** `engineering@apex.com`.
