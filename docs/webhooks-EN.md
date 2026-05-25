# Webhook contract (English)

This file is a focused reference for the FPG → APEX webhook stream. The same
information is also embedded in [`fpg-api-spec-EN.md`](./fpg-api-spec-EN.md) §14.

## Endpoint (APEX-side ingress)

```
POST https://api.apex.com/v1/webhooks/fpg
```

Local demo endpoint:

```
POST http://localhost:3000/api/internal/webhooks/fpg
```

## Headers

| Header                | Value                                                                |
|-----------------------|----------------------------------------------------------------------|
| `X-FPG-Event-Id`      | ULID-style identifier `evt_01...`                                    |
| `X-FPG-Event-Type`    | One of the event types in §14.4 of the API spec                      |
| `X-FPG-Signature`     | `t=<unix-s>, v1=<hex>` — HMAC-SHA256 (see below)                     |
| `Content-Type`        | `application/json`                                                   |

## Body

```json
{
  "id": "evt_01HXY8K2Q7N…",
  "type": "deposit_completed",
  "created_at": "2026-05-25T07:14:32Z",
  "client_apex_id": "APX-100482",
  "client_fpg_id": "FPG-7740921",
  "data": {
    "deposit_id": "dp_…",
    "fpg_txn_id": "FPG-DEP-A8412",
    "amount": 25000,
    "currency": "USD",
    "method": "Visa / Mastercard"
  }
}
```

## Signature

```
v1 = HMAC_SHA256(webhook_secret, `${t}.${event_id}.${raw_body}`)
```

Steps to verify on the receiver:

1. Parse `X-FPG-Signature` into `{ t, v1 }`.
2. Reject if `|now − t| > 300 seconds`.
3. Recompute `expected = HMAC_SHA256(webhook_secret, `${t}.${event_id}.${raw_body}`)`
   and constant-time compare with `v1`. Reject on mismatch.
4. Deduplicate by `event_id` (the APEX store keeps the last 5000).
5. Process the event idempotently.
6. Return `200 OK { "ok": true, "event_id": "..." }` (or `{ "status": "duplicate" }`).

## Retry policy

Delays between attempts (sender):

| Attempt | Delay     |
|---------|-----------|
| 1       | immediate |
| 2       | 30 s      |
| 3       | 2 min     |
| 4       | 10 min   |
| 5       | 1 h       |
| 6       | 8 h       |

After 6 attempts the event is `dropped`. The sender emits an
`incident_opened` event with payload `{ original_event_id: ... }`.

## Replay

```
POST /v1/webhooks/{event_id}/replay
Authorization: Bearer <token with webhooks.replay>
Idempotency-Key: <uuid>
```

Returns `202 { event_id, status: "scheduled" }`.

## Event catalogue

See §14.4 of the API spec. 36 distinct event types organized in 8 categories
(KYC, Client, Trading account, Deposit, Withdrawal, Trading, Commission,
Technical).

## Failure modes the receiver MUST handle

* **Late delivery** — events for an entity may arrive out of order. Always
  use `client_apex_id` / `deposit_id` / `withdrawal_id` to look up current
  state instead of trusting the event order.
* **Duplicate delivery** — `event_id` dedup is mandatory.
* **Forged events** — the signature check is the only gate. Never trust
  payload fields without verifying first.
* **Timing attacks** — use constant-time compare on the HMAC.

## Operational visibility

The admin `/webhooks` page shows:

* Last 1842+ events with status (`delivered`, `retry`, `dropped`)
* HMAC verification result for each
* Per-event latency (`durationMs`)
* Throughput per hour
* `Replay` button per event (calls the endpoint above)

The audit log (`/audit`) records every webhook receive with actor
`FPG webhook` and the verification outcome.
