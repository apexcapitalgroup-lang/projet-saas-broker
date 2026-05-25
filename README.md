# APEX powered by FPG

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fapexcapitalgroup-lang%2Fprojet-saas-broker&project-name=apex-powered-by-fpg&repository-name=apex-powered-by-fpg&env=APEX_SESSION_SECRET,FPG_HMAC_SECRET,FPG_WEBHOOK_SECRET,FPG_CLIENT_ID,FPG_CLIENT_SECRET,PERSIST&envDescription=Secrets%20required%20by%20the%20APEX%20%C3%97%20FPG%20demo)

**Production-grade reference implementation of the APEX × Fortune Prime Global integration.**

**Live demo:** https://apex-powered-by-fpg.vercel.app *(deployed via the button above)*

**Public repo:** https://github.com/apexcapitalgroup-lang/projet-saas-broker

This repository contains:

1. **A complete admin console** at `/dashboard` — operations, KYC review,
   trading accounts, deposits, withdrawals, reconciliation, commissions,
   webhooks, audit, security, settings.
2. **A complete client portal** at `/portal` — signup, KYC upload,
   onboarding, account dashboard, MT4/MT5 accounts, deposits, withdrawals,
   documents, profile.
3. **A working FPG mock API** at `/api/fpg/v1/*` — the exact endpoint surface
   FPG must implement, with HMAC-signed responses, idempotency, OAuth2,
   scoped permissions, signed webhooks, retries, and replays.
4. **A bilingual specification** in `docs/fpg-api-spec-EN.md` and
   `docs/fpg-api-spec-FR.md` — what FPG must build on their side.

Everything works end-to-end against in-memory mock data.

---

## Quickstart

```bash
pnpm install
pnpm dev
```

Open **http://localhost:3000**.

### Demo credentials

| Surface       | Email                            | Password           | 2FA       |
|---------------|----------------------------------|--------------------|-----------|
| Admin console | `ariane.m@apex-ops.com`          | `ApexDemo!2026`    | `123456`  |
| Client portal | `s.lindqvist@northforest.io`     | `TraderDemo!2026`  | —         |

* Admin entry: `/login` → 2FA → `/dashboard`
* Client entry: `/portal-login` → `/portal`
* PSP demo: opens automatically during the deposit flow at `/fpg-psp-mock/[id]`

### FPG OAuth credentials (for the mock)

```
client_id     = apex_demo
client_secret = apex_demo_secret_change_in_prod
```

Issue a token:

```bash
curl -X POST http://localhost:3000/api/fpg/v1/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"client_credentials","client_id":"apex_demo","client_secret":"apex_demo_secret_change_in_prod","scope":"read accounts.create payments.initiate reporting"}'
```

---

## Architecture

```
                   ┌────────────────────────────────────────────────────────┐
                   │                          APEX                          │
                   │                                                        │
   Trader ──────►  │  Client portal (/portal/*) ─────► /api/portal/*        │
                   │                                          │             │
                   │  Operations team ────► Admin console (/dashboard/*)    │
                   │                                          │             │
                   │                                          ▼             │
                   │                       APEX → FPG client (Bearer + idempotent)
                   └────────────────────────────────┬───────────────────────┘
                                                    │
                                                    ▼
                   ┌──────────────────────────────────────────────────────────┐
                   │                       FPG (broker)                       │
                   │  /api/fpg/v1/* — clients, KYC, accounts, deposits,       │
                   │                  withdrawals, trades, IB volumes,        │
                   │                  commissions, reconciliation             │
                   │                                  │                       │
                   │                                  ▼                       │
                   │  Webhook dispatcher ───► signed POST → APEX /webhooks/fpg│
                   └──────────────────────────────────────────────────────────┘
```

In this repo APEX and FPG run in the **same Node process**. The demo loop:

1. Client clicks **Deposit** in `/portal/deposit`.
2. APEX `/api/portal/deposits` calls the FPG mock `/api/fpg/v1/deposits/sessions`
   (Bearer + Idempotency-Key).
3. FPG mock returns a hosted-payment URL → `/fpg-psp-mock/[id]`.
4. Client interacts with the simulated PSP page.
5. PSP page calls `/api/fpg/v1/internal/psp-callback/[id]`.
6. FPG mock dispatches a signed `deposit_completed` webhook.
7. APEX `/api/internal/webhooks/fpg` verifies the signature, deduplicates by
   `event_id`, credits the trading account balance.
8. The client portal refresh shows the new balance.

---

## What's inside

```
src/
├── app/
│   ├── (app)/                  Admin console pages (sidebar, topbar, tables)
│   ├── (portal)/portal/        Client portal pages
│   ├── api/
│   │   ├── auth/               Admin + portal login, 2FA, signup, session
│   │   ├── admin/              Internal admin endpoints (RBAC-protected)
│   │   ├── portal/             Client-facing endpoints
│   │   ├── fpg/v1/             FPG mock API (the contract FPG must implement)
│   │   └── internal/webhooks/  Webhook ingress from FPG (signature-verified)
│   ├── login/                  Admin login page
│   ├── portal-login/           Client portal login page
│   ├── portal-signup/          Client portal signup wizard
│   └── fpg-psp-mock/[id]       Simulated PSP hosted-payment page
├── components/                 Reusable UI primitives (Icons, Pill, Table, …)
├── lib/                        format(), now(), fx(), ids()
├── server/                     Data store, auth, FPG middleware, crypto, webhooks
│   ├── types.ts                All entity types
│   ├── store.ts                Singleton in-memory store + persistence
│   ├── seed.ts                 Deterministic seed (used at boot)
│   ├── crypto.ts               Password hashing, HMAC, TOTP
│   ├── auth.ts                 Sessions, cookies, guards
│   ├── audit.ts                Audit log helper
│   ├── http.ts                 Response helpers, error envelopes, IP/UA
│   ├── guards.ts               adminGuard / clientGuard
│   ├── fpg/                    OAuth tokens, idempotency, FPG middleware
│   └── webhooks/               Dispatcher, signing, handlers
└── middleware.ts               Route protection (admin / portal)

docs/
├── fpg-api-spec-EN.md          Full FPG API spec — English
├── fpg-api-spec-FR.md          Full FPG API spec — French
├── architecture.md             Component & request-flow diagrams
├── security.md                 Security model, key rotation, IP allow-list
└── operational-runbook.md      How to seed, reset, simulate failures
```

---

## Security highlights

* **Sessions**: HTTP-only, SameSite=Lax, HMAC-signed token, 45-minute sliding TTL.
* **Passwords**: scrypt (Node built-in), unique salt per user, constant-time compare.
* **2FA**: TOTP RFC 6238, ±1 30-second window for clock skew (demo code `123456`).
* **CSP, HSTS, X-Frame-Options DENY, Permissions-Policy** set globally in
  `next.config.ts`.
* **FPG API**: OAuth2 client_credentials, scoped permissions, IP allow-list
  (in real deployments), 24h Bearer TTL.
* **Idempotency**: every state-changing POST/PATCH requires `Idempotency-Key`.
* **Webhooks**: HMAC-SHA256 signature, 5-min replay protection, deduplicated
  by `event_id`, exponential retry up to 6 attempts.
* **Audit log**: append-only, every action logged with actor, role, IP, UA,
  result, correlation id.

---

## Persistence model

For the demo we persist to `data/db.json` (gitignored). To wipe:

```bash
rm data/db.json
pnpm dev   # re-seeds automatically
```

To run without persistence (e.g. on Vercel where the filesystem is ephemeral):

```bash
PERSIST=false pnpm dev
```

The seed is **deterministic** (Mulberry32 PRNG, fixed seed `0xa9ec_dead`) so
the data layout is identical across runs.

---

## Production build

```bash
pnpm build
pnpm start
```

29 pages + 31 API routes. TypeScript strict, no `any` casts.

---

## Acceptance tests (from the §15.2 cahier des charges)

| Test                | Curl path                                                     |
|---------------------|---------------------------------------------------------------|
| Onboarding          | `POST /api/auth/portal/signup`                                |
| KYC submitted       | `POST /api/fpg/v1/clients/{id}/kyc/documents`                 |
| KYC approved        | `PATCH /api/fpg/v1/clients/{id}/kyc/status {status:approved}` |
| KYC rejected        | `PATCH … {status:rejected, reason:…}`                         |
| Account creation    | `POST /api/fpg/v1/clients/{id}/trading-accounts`              |
| Deposit completed   | Click `Pay` on `/fpg-psp-mock/[id]`                           |
| Deposit failed      | Click `Simulate failure`                                      |
| Withdrawal approved | `PATCH /api/fpg/v1/withdrawals/{id} {decision:approve}`       |
| Withdrawal rejected | `PATCH … {decision:reject, reason:…}`                         |
| Webhook retry       | Stop the receiver and watch retries in `/webhooks` admin      |
| Reconciliation      | `GET /api/fpg/v1/ib/APEX/reconciliation`                      |
| Security            | All HMAC + idempotency tests pass automatically               |

A scripted smoke test is provided:

```bash
bash scripts/smoke.sh
```

---

## License

Confidential. © APEX 2026. For FPG review.
