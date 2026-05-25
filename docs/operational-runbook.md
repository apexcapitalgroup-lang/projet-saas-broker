# Operational runbook (bilingual)

## EN

### Reset demo data

```bash
rm -f data/db.json
pnpm dev
```

This re-seeds the deterministic dataset (382 clients, 8 trading accounts,
1900+ webhook events, 7 reconciliation rows, monthly statements, ...).

### Switch off persistence (e.g. for Vercel deploy)

```bash
PERSIST=false pnpm dev
```

The store still works in-memory but won't flush to disk.

### Trigger acceptance tests by curl

```bash
# 1. OAuth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/fpg/v1/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"client_credentials","client_id":"apex_demo","client_secret":"apex_demo_secret_change_in_prod","scope":"read accounts.create payments.initiate kyc.upload reporting webhooks.replay"}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])')

# 2. Create a fresh client (idempotent)
curl -s -X POST http://localhost:3000/api/fpg/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H 'Content-Type: application/json' \
  -d '{"apex_correlation_id":"APX-900042","first_name":"Test","last_name":"Acme",
       "email":"test@example.com","phone":"+33612345678",
       "date_of_birth":"1990-01-01","nationality":"France",
       "country_of_residence":"France","country_of_tax_residence":"France",
       "address":{"street":"1 rue","city":"Paris","postal_code":"75000"},
       "registration_ip":"127.0.0.1","user_agent":"runbook"}'

# 3. Approve KYC
curl -X PATCH http://localhost:3000/api/fpg/v1/clients/APX-900042/kyc/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved"}'

# 4. Create MT5 Raw account
curl -X POST http://localhost:3000/api/fpg/v1/clients/APX-900042/trading-accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H 'Content-Type: application/json' \
  -d '{"platform":"MT5","mode":"Live","account_type":"Raw","currency":"USD","leverage":100}'

# 5. Initiate a deposit
curl -X POST http://localhost:3000/api/fpg/v1/deposits/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H 'Content-Type: application/json' \
  -d '{"apex_correlation_id":"apex-dep-test","trading_account_login":"FPG7742237-L1","amount":1000,"currency":"USD","method_key":"visa_mc"}'
```

### Simulate webhook failure

* Stop the dev server with `Ctrl-C`.
* Trigger a deposit from the portal.
* Observe the FPG mock dispatcher retrying with exponential back-off
  (30 s → 2 min → 10 min → 1 h → 8 h).
* Restart the server. Replay manually from the admin `/webhooks` page or via:

```bash
curl -X POST http://localhost:3000/api/fpg/v1/webhooks/<event_id>/replay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

### Rotate API keys / secrets

* APEX session secret → env var `APEX_SESSION_SECRET`; restart.
* FPG OAuth client secret → env vars `FPG_CLIENT_ID`, `FPG_CLIENT_SECRET`;
  restart. Old tokens remain valid until their natural expiry.
* FPG webhook secret → env var `FPG_WEBHOOK_SECRET`; rotation requires
  coordination with the receiver.
* FPG response HMAC secret → env var `FPG_HMAC_SECRET`.

---

## FR

### Réinitialiser les données de démo

```bash
rm -f data/db.json
pnpm dev
```

Recrée le dataset déterministe (382 clients, 8 comptes trading, 1900+ événements
webhook, 7 lignes de réconciliation, statements mensuels, ...).

### Désactiver la persistance (ex. Vercel)

```bash
PERSIST=false pnpm dev
```

Le store fonctionne en mémoire mais ne flush plus sur disque.

### Lancer les tests d'acceptation par curl

(voir version anglaise ci-dessus — les commandes sont génériques)

### Simuler une panne de webhook

* Arrêter le dev server (Ctrl-C).
* Déclencher un dépôt depuis le portail.
* Observer les tentatives du dispatcher (30 s → 2 min → 10 min → 1 h → 8 h).
* Relancer le serveur. Replay manuel depuis la page admin `/webhooks` ou via
  curl :

```bash
curl -X POST http://localhost:3000/api/fpg/v1/webhooks/<event_id>/replay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

### Rotation des secrets

* Secret session APEX → variable `APEX_SESSION_SECRET` ; redémarrage.
* Secret OAuth client FPG → variables `FPG_CLIENT_ID`, `FPG_CLIENT_SECRET` ;
  redémarrage. Les tokens existants restent valides jusqu'à expiration
  naturelle.
* Secret webhook FPG → variable `FPG_WEBHOOK_SECRET` ; coordination avec le
  receiver.
* Secret HMAC réponse → variable `FPG_HMAC_SECRET`.
