# Architecture (bilingual)

## EN — How the demo runs end-to-end

```
                                      ┌──────────────────────────────┐
   Client browser                     │   APEX (Next.js App Router)  │
   ─────────────                      │                              │
   • /portal-login    ───POST /api/auth/portal/login                 │
   • /portal/...      ───GET  /api/portal/me                         │
   • /portal/deposit  ───POST /api/portal/deposits                   │
                              │       │                              │
                              │       ▼                              │
                              │      ╔═══════════════════════╗       │
                              │      ║  FPG mock /v1/...     ║       │
                              │      ║  – OAuth tokens        ║       │
                              │      ║  – Idempotency cache   ║       │
                              │      ║  – HMAC-signed replies ║       │
                              │      ║  – Webhook dispatcher  ║       │
                              │      ╚═══════╤═══════════════╝       │
                              │              │                       │
                              │              │ signed webhook        │
                              │              ▼                       │
                              │      ┌────────────────────────┐      │
   client redirected ◄────────┘      │ /api/internal/webhooks/│      │
   to /fpg-psp-mock/[id]             │   fpg                  │      │
   (simulated PSP page)              │ – verify HMAC          │      │
                                     │ – dedupe by event_id   │      │
   PSP page POSTs to ──────────────► │ – mutate APEX state    │      │
   /api/fpg/v1/internal/psp-callback │                        │      │
                                     └────────────────────────┘      │
                                                                     │
   Admin browser                                                     │
   ─────────────                                                     │
   • /login           ──POST /api/auth/admin/login                   │
   • /login           ──POST /api/auth/admin/twofa                   │
   • /dashboard       ──GET  /api/admin/clients                      │
   • /kyc             ──POST /api/admin/kyc/[apex]/decision          │
   • /withdrawals     ──POST /api/admin/withdrawals/[id]/decision    │
   • /webhooks        ──GET  /api/admin/webhooks (5s polling)        │
                                                                     │
   FPG webhook origin (in real life)                                 │
   ──────────────────                                                │
   POST → /api/internal/webhooks/fpg (signed)                        │
                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

In production:

* APEX and FPG run in **different Node processes** (different clouds).
* The FPG mock layer becomes the real FPG broker infrastructure.
* The PSP page is hosted by the real PSP (FPG-PSP, Apex-PSP-FPG, FPG-Crypto-Gateway).
* `/api/internal/webhooks/fpg` is publicly reachable, hardened with a WAF +
  IP allow-list + HMAC signature verification.

---

## FR — Comment la démo s'exécute de bout en bout

Le même schéma s'applique. Les flux clés :

1. **Inscription portail** : POST `/api/auth/portal/signup` →
   le client est créé côté APEX, un webhook `client_created` est dispatché ;
   le handler attribue un `fpg_client_id`.
2. **KYC** : upload via `POST /api/fpg/v1/clients/{id}/kyc/documents` →
   transition automatique en `under_review` ; un admin valide via
   `POST /api/admin/kyc/{apex}/decision` → événement `kyc_approved`.
3. **Création de compte trading** : POST `/api/fpg/v1/clients/{id}/trading-accounts`
   → réponse 201 avec login MT4/MT5 → événement `trading_account_created`.
4. **Dépôt** : le portail POST sur `/api/portal/deposits` →
   APEX émet une session via `/api/fpg/v1/deposits/sessions` → redirection vers
   `/fpg-psp-mock/[id]` → le PSP mock POST sur
   `/api/fpg/v1/internal/psp-callback/[id]` → événement `deposit_completed`
   → handler crédite le solde du compte.
5. **Retrait** : le portail POST sur `/api/portal/withdrawals` → événement
   `withdrawal_requested` puis `withdrawal_under_review` → un admin approuve
   via `/api/admin/withdrawals/{id}/decision` → `withdrawal_approved` →
   `withdrawal_completed`.

---

## Component tree (full)

```
src/
├── app/
│   ├── (app)/                 admin pages (sidebar + topbar)
│   │   ├── dashboard/           overview
│   │   ├── clients/             list + detail
│   │   ├── kyc/                 review queue
│   │   ├── accounts/            MT4/MT5 list
│   │   ├── deposits/
│   │   ├── withdrawals/
│   │   ├── reconciliation/
│   │   ├── reporting/
│   │   ├── commissions/
│   │   ├── webhooks/
│   │   ├── audit/
│   │   ├── security/
│   │   └── settings/
│   ├── (portal)/portal/       client portal pages
│   │   ├── (overview)        equity hero
│   │   ├── accounts/           MT4/MT5 with credentials
│   │   ├── deposit/            hosted payment flow
│   │   ├── withdraw/
│   │   ├── transactions/
│   │   ├── documents/
│   │   ├── profile/
│   │   └── onboarding/
│   │       ├── kyc/
│   │       └── account/
│   ├── login/                  admin login (2-step + 2FA)
│   ├── portal-login/           client login
│   ├── portal-signup/          5-step wizard
│   ├── fpg-psp-mock/[id]/      simulated PSP page
│   └── api/
│       ├── auth/{admin,portal}/{login,twofa,signup,session,logout}
│       ├── admin/{clients,kyc,withdrawals,webhooks,audit}/...
│       ├── portal/{me,accounts,deposits,withdrawals,transactions}
│       ├── fpg/v1/             FPG mock surface (16 endpoints)
│       └── internal/webhooks/fpg   webhook ingress
├── components/                shared UI primitives + brand
├── lib/                       format / now / fx / ids
├── server/                    backend logic
│   ├── types.ts                 entity types
│   ├── store.ts                 singleton + tx() mutex
│   ├── seed.ts                  deterministic seed
│   ├── persist.ts               disk persistence (debounced)
│   ├── auth.ts                  sessions + guards
│   ├── crypto.ts                scrypt, HMAC, TOTP
│   ├── audit.ts                 audit helper
│   ├── http.ts                  json helpers, errors
│   ├── guards.ts                adminGuard / clientGuard
│   ├── fpg/                     FPG mock middleware
│   │   ├── credentials.ts
│   │   ├── tokens.ts
│   │   ├── idempotency.ts
│   │   └── middleware.ts        runFpg(), signAndSend()
│   └── webhooks/
│       ├── dispatcher.ts        outgoing + retry + replay
│       └── handlers.ts          incoming handler map
└── middleware.ts              route protection
```
