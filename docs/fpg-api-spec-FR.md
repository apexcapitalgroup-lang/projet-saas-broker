# APEX powered by FPG — Spécification API FPG (Français)

**Version 1.0 · 25 mai 2026**
**Destinataires : équipes ingénierie, opérations, conformité et paiements FPG.**

Ce document spécifie les endpoints, payloads, événements webhook et règles
opérationnelles que FPG doit exposer pour permettre à APEX d'offrir l'expérience
client complète tout en laissant FPG opérer le broker régulé.

Chaque endpoint dispose d'une implémentation de référence fonctionnelle dans ce
dépôt (`/api/fpg/v1/...`). FPG peut exécuter la référence, comparer
requêtes/réponses, et reproduire le contrat à l'identique.

---

## 1 · Sommaire

1. [Vue d'ensemble & principes](#1-vue-densemble)
2. [Authentification & scopes](#2-authentification--scopes)
3. [Idempotence](#3-idempotence)
4. [Signature des réponses](#4-signature-des-réponses)
5. [Format d'erreur](#5-format-derreur)
6. [Rate limiting](#6-rate-limiting)
7. [Endpoints — Clients](#7-endpoints--clients)
8. [Endpoints — KYC](#8-endpoints--kyc)
9. [Endpoints — Comptes trading](#9-endpoints--comptes-trading)
10. [Endpoints — Dépôts](#10-endpoints--dépôts)
11. [Endpoints — Retraits](#11-endpoints--retraits)
12. [Endpoints — Historique trading](#12-endpoints--historique-trading)
13. [Endpoints — Volumes IB, commissions, réconciliation](#13-endpoints--ib)
14. [Webhooks](#14-webhooks)
15. [Sandbox & production](#15-sandbox--production)
16. [Glossaire](#16-glossaire)

---

## 1 · Vue d'ensemble

**Modèle opérationnel.** APEX est la couche front-office et opérations. FPG
reste broker de référence, détient la relation réglementaire client, garde les
fonds, opère MT4/MT5, exécute les ordres, valide les KYC et les retraits.
**APEX ne reçoit, ne détient et ne transfère jamais de fonds clients.**

**Mapping des identifiants.** Chaque entité porte les deux identifiants :

| Champ                  | Émetteur | Format        | Exemple            |
|------------------------|----------|---------------|--------------------|
| `apex_correlation_id`  | APEX     | `APX-NNNNNN`  | `APX-100482`       |
| `fpg_client_id`        | FPG      | `FPG-NNNNNN`  | `FPG-7740921`      |
| `apex_correlation_id`  | APEX     | `apex-<…>`    | `apex-dep-7e2c4a`  |
| `fpg_txn_id`           | FPG      | `FPG-<…>`     | `FPG-DEP-A8412`    |

Le mapping est forcé dès la première requête (`POST /v1/clients` envoie
`apex_correlation_id` et reçoit `fpg_client_id`).

**URLs de base.**

| Environnement | URL de base                                            |
|---------------|--------------------------------------------------------|
| Sandbox       | `https://sandbox-api.fortuneprime.com/v1`              |
| Production    | `https://api.fortuneprime.com/v1`                      |
| Démo (ici)    | `http://localhost:3000/api/fpg/v1`                     |

**Content type.** Les requêtes et réponses sont en
`application/json; charset=utf-8`, sauf `POST /oauth/token` qui accepte aussi
`application/x-www-form-urlencoded`.

---

## 2 · Authentification & scopes

### 2.1 Grant OAuth2 `client_credentials`

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

Réponse (200) :

```json
{
  "access_token": "fpg_NESN1V2HMZ2BS99W",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "read kyc.upload accounts.create payments.initiate reporting webhooks.replay"
}
```

Les jetons sont valides 24 h. Tous les appels suivants doivent porter :

```
Authorization: Bearer <access_token>
```

### 2.2 Scopes

| Scope                 | Autorise                                              |
|-----------------------|-------------------------------------------------------|
| `read`                | Tous les GET                                          |
| `kyc.upload`          | Upload de documents KYC + lecture statuts             |
| `accounts.create`     | Création / mise à jour clients, comptes, levier       |
| `payments.initiate`   | Création de sessions de dépôt et de retraits          |
| `reporting`           | Volumes, commissions, statements, réconciliation      |
| `webhooks.replay`     | Déclenchement de replays manuels                      |

Une requête sans le scope requis renvoie **403 `fpg.scope_insufficient`**.

### 2.3 Allow-listing IP

En production FPG, les IP sortantes statiques d'APEX (communiquées
out-of-band) sont allow-listées. Toute autre IP renvoie **403 `fpg.ip_not_allowed`**.

### 2.4 Rotation des secrets

Les secrets clients API sont tournés tous les 90 jours par défaut. Pendant la
rotation, les deux clés (ancienne + nouvelle) sont acceptées sur une fenêtre de
7 jours.

---

## 3 · Idempotence

Toutes les requêtes à effet d'état (`POST`, `PATCH`, `DELETE`) **doivent**
porter :

```
Idempotency-Key: <chaîne opaque jusqu'à 128 caractères>
```

Sans clé : **400 `fpg.idempotency_key_required`**.

Comportement :

* **Premier appel** → requête traitée, réponse mise en cache 24 h.
* **Replay identique** (même clé, même body, même endpoint) → réponse cachée,
  même status HTTP, header `x-fpg-idempotent-replay: true`.
* **Body différent** (même clé, body différent) → **409
  `fpg.idempotency_mismatch`**.
* **Endpoint différent** (même clé, endpoint différent) → **409
  `fpg.idempotency_endpoint_mismatch`**.

Utilisez des UUIDs ou des identifiants de corrélation APEX
(`apex-dep-7e2c4a`, `apex-wd-9114ce`).

---

## 4 · Signature des réponses

Chaque réponse JSON inclut :

```
X-FPG-Signature: t=1716628800, v1=4e2c7ab09d0a3fbe8…
X-FPG-Api-Version: 1.0
X-Request-Id: req-0tpj413f4p43
```

Algorithme :

```
v1 = HMAC_SHA256(secret_de_signature, `${t}.${request_id}.${corps_brut_de_la_réponse}`)
```

`t` = timestamp Unix en secondes au moment de la signature. Les clients
doivent rejeter les réponses où `|maintenant - t| > 300 secondes`.

Le **même algorithme** est utilisé pour signer les **webhooks** (cf. §14).

---

## 5 · Format d'erreur

Toutes les erreurs partagent la même structure :

```json
{
  "error": {
    "code": "fpg.<domaine>.<raison>",
    "message": "Explication lisible",
    "field": "deposits.amount",
    "details": { "free_margin": 12000 }
  },
  "request_id": "req-0tpj413f4p43"
}
```

Codes courants :

| HTTP | Code                              | Signification                              |
|------|-----------------------------------|--------------------------------------------|
| 400  | `request.invalid_json`            | Body JSON invalide                         |
| 400  | `fpg.idempotency_key_required`    | Idempotency-Key manquante                  |
| 401  | `fpg.missing_bearer`              | Authorization absent                       |
| 401  | `fpg.invalid_token`               | Bearer inconnu                             |
| 401  | `fpg.token_expired`               | Bearer expiré                              |
| 401  | `webhook.signature_mismatch`      | Signature de webhook invalide              |
| 403  | `fpg.scope_insufficient`          | Scope manquant                             |
| 403  | `fpg.ip_not_allowed`              | IP non allow-listée                        |
| 404  | `fpg.client_not_found`            | Client inconnu                             |
| 404  | `fpg.account_not_found`           | Compte trading inconnu                     |
| 409  | `fpg.idempotency_mismatch`        | Idempotency-Key rejouée avec body différent|
| 409  | `fpg.client_already_exists`       | Apex correlation id déjà mappé             |
| 422  | `fpg.validation`                  | Schéma de body invalide                    |
| 422  | `fpg.kyc_not_approved`            | KYC requis non approuvé                    |
| 422  | `fpg.kyc_invalid_transition`      | Transition d'état KYC interdite            |
| 422  | `fpg.withdrawal_invalid_transition`| Transition d'état retrait interdite       |
| 422  | `fpg.aml.method_mismatch`         | Règle AML « same source » violée           |
| 422  | `fpg.leverage_above_jurisdiction_cap` | Levier au-dessus du plafond juridiction|
| 422  | `fpg.insufficient_free_margin`    | Retrait > marge libre                      |
| 429  | `fpg.rate_limited`                | Rate limit atteint (voir Retry-After)      |
| 500  | `fpg.internal`                    | Erreur interne                             |

---

## 6 · Rate limiting

Chaque `client_id` dispose d'un token bucket :
**60 requêtes/seconde** en burst, **1000/minute** soutenu.

Chaque réponse comporte :

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 994
X-RateLimit-Reset: 1716628890
```

Les réponses `429` incluent `Retry-After: <secondes>`. Appliquer un back-off
exponentiel.

---

## 7 · Endpoints — Clients

### 7.1 `POST /v1/clients` — Créer un client

**Scope :** `accounts.create`. **Idempotency-Key obligatoire.**

Body de requête :

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

Réponse (201) :

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

Émet le webhook `client_created`.

### 7.2 `GET /v1/clients`

**Scope :** `read`.

Query : `page`, `page_size`, `apex_correlation_id`, `email`, `status`,
`kyc_status`, `ib_code`. Retourne `{ items, page, page_size, total }`.

### 7.3 `GET /v1/clients/{id}` — Récupérer

`{id}` peut être soit `apex_correlation_id`, soit `fpg_client_id`.

### 7.4 `PATCH /v1/clients/{id}` — Mettre à jour

**Idempotency-Key obligatoire.** Champs modifiables : `phone`, `email`,
`address`, `language`, `suitability`.

---

## 8 · Endpoints — KYC

### 8.1 `POST /v1/clients/{id}/kyc/documents` — Upload

**Scope :** `kyc.upload`. **Idempotency-Key obligatoire.**

```json
{
  "kind": "passport",
  "filename": "passport_lindqvist.pdf",
  "mime": "application/pdf",
  "bytes": 1247201,
  "content_base64": "JVBERi0xLjcKJcfsj6IK…"
}
```

`kind` de document : `id_front`, `id_back`, `passport`, `selfie`,
`proof_of_address`, `source_of_funds`, et pour le KYB :
`incorporation_certificate`, `ubo_register`, `directors_register`,
`board_resolution`.

Effet de bord : dès qu'un client a ≥ 2 documents et est en `pending`, le statut
KYC passe automatiquement à `under_review` et émet `kyc_submitted`.

### 8.2 `GET /v1/clients/{id}/kyc/documents`

Liste tous les documents avec leur statut.

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

Statuts : `pending`, `under_review`, `approved`, `rejected`,
`resubmit_required`, `document_missing`, `compliance_hold`,
`enhanced_due_diligence`.

### 8.4 `PATCH /v1/clients/{id}/kyc/status` — Décision (FPG interne)

**Scope :** `kyc.upload`. Body : `{ status, reason?, document?, next_step? }`.

Émet l'un de : `kyc_approved`, `kyc_rejected`, `kyc_resubmit_required`,
`document_missing`, `compliance_hold`.

Machine d'état :

```
pending             → under_review | document_missing | compliance_hold | approved | rejected
under_review        → approved | rejected | resubmit_required | compliance_hold | enhanced_due_diligence
approved            → enhanced_due_diligence | compliance_hold | rejected
rejected            → resubmit_required
resubmit_required   → under_review | rejected
document_missing    → under_review | rejected
compliance_hold     → approved | rejected | enhanced_due_diligence
enhanced_due_diligence → approved | rejected | compliance_hold
```

---

## 9 · Endpoints — Comptes trading

### 9.1 `POST /v1/clients/{id}/trading-accounts` — Création

**Scope :** `accounts.create`. **Idempotency-Key obligatoire.**

```json
{ "platform": "MT5", "mode": "Live", "account_type": "Raw",
  "currency": "USD", "leverage": 200 }
```

Réponse (201) :

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

Règles :

* Compte `Live` → exige `kyc_status: approved` (ou `enhanced_due_diligence`).
* Maximum 5 comptes par client.
* Routage serveur par résidence : APAC → `FPG-Live-03`, sinon round-robin
  `FPG-Live-01/02`, demo → `FPG-Demo-01`.
* Émet `trading_account_created`.
* Le mot de passe trading n'est **jamais** retourné en clair. Le mot de passe
  initial passe par `POST /v1/trading-accounts/{login}/password-reset`.

### 9.2 `GET /v1/clients/{id}/trading-accounts`

Liste les comptes du client.

### 9.3 `GET /v1/trading-accounts/{login}/summary`

Miroir temps réel : balance / equity / margin / free margin / open PnL.

### 9.4 `PATCH /v1/trading-accounts/{login}/leverage`

**Idempotency-Key obligatoire.** Body : `{ "leverage": 100 }`. Applique les
plafonds par juridiction (ex. EU/UK plafonnés à 30:1). Émet `leverage_changed`.

### 9.5 `POST /v1/trading-accounts/{login}/password-reset`

Génère un ticket éphémère. FPG envoie un URL one-time par email. Émet
`password_reset_requested`.

---

## 10 · Endpoints — Dépôts

### 10.1 `GET /v1/deposit-methods`

```
GET /v1/deposit-methods?country=Sweden&currency=USD&amount=5000
```

Retourne la liste des méthodes disponibles pour ce contexte avec PSP, montants
min/max, frais en %, délais de traitement.

### 10.2 `POST /v1/deposits/sessions` — Hosted payment

**Scope :** `payments.initiate`. **Idempotency-Key obligatoire.**

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

Réponse (201) :

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

Le navigateur du client est redirigé vers `hosted_url`. La page PSP est
opérée par FPG ; APEX **ne voit jamais** les données carte. FPG envoie les
événements webhook au fur et à mesure (`deposit_pending`, `deposit_completed`,
`deposit_failed`, `deposit_chargeback`, `deposit_refund`).

### 10.3 `GET /v1/deposits/{id}`

`{id}` peut être `deposit_id`, `fpg_txn_id` ou `apex_correlation_id`.

---

## 11 · Endpoints — Retraits

### 11.1 `POST /v1/withdrawals` — Demande

**Scope :** `payments.initiate`. **Idempotency-Key obligatoire.**

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

Validations : KYC approuvé, montant ≤ marge libre, règle « same source » sur
`visa_mc_refund`.

Émet `withdrawal_requested`, puis `withdrawal_under_review` après ~1,5 s.

### 11.2 `PATCH /v1/withdrawals/{id}` — Décision (FPG interne)

```json
{ "decision": "approve" | "reject" | "processing" | "complete" | "fail",
  "reason": "AML — source of funds documentation required" }
```

Machine d'état :

```
requested      → under_review | approved | rejected
under_review   → approved | rejected
approved       → processing | rejected
processing     → completed | failed
completed | rejected | failed → (terminal)
```

Émet le webhook correspondant.

### 11.3 `GET /v1/withdrawals` & `GET /v1/withdrawals/{id}`

Liste et récupération standard.

---

## 12 · Endpoints — Historique trading

### 12.1 `GET /v1/clients/{id}/trades`

**Scope :** `read` ou `reporting`.

Query : `from`, `to`, `symbol`, `account_login`, `page`, `page_size`.

Retourne les trades clos paginés : ticket, symbole, sens, lots, heures
d'ouverture/clôture, prix, commission, swap, PnL.

---

## 13 · Endpoints — IB

### 13.1 `GET /v1/ib/APEX/volumes`

**Scope :** `reporting`.

Query : `from`, `to`, `group_by` (`day | symbol | client | account`),
`client_id`, `symbol`.

Retourne des agrégats : `{ items: [{day, lots, notional_usd, trades}], totals }`.

### 13.2 `GET /v1/ib/APEX/commissions`

Retourne les entrées de commission (trades + ajustements : scalping exclu,
clients exclus, chargebacks, rebates) en granularité journalière, plus les
totaux (`gross`, `adjustments`, `net_payable`).

### 13.3 `GET /v1/ib/APEX/statements`

Liste les statements mensuels avec `gross_amount`, `adjustments`, `net_payable`,
`lots`, `rate_average`, `generated_at`, `due_date`, `status`, `paid_at`,
`download_url`.

### 13.4 `GET /v1/ib/APEX/reconciliation`

Lignes de réconciliation journalière comparant les ledgers APEX vs FPG
(dépôts, retraits, volume en lots). Un `delta_usd` non nul → ligne marquée
`status: delta`.

### 13.5 Formule de rémunération (mai 2026)

```
net_payable = lots_éligibles × taux_usd_par_lot − ajustements
```

* `lots_éligibles = total_lots − lots_scalping − lots_clients_exclus`
* Exclus : trades détenus < 60 s (scalping détecté par FPG)
* Clients exclus : tout client sous `compliance_hold` durant le mois
* Cut-off : dernier jour de trading UTC du mois
* Règlement : net 15 jours, virement USD

---

## 14 · Webhooks

FPG envoie des POST signés à l'endpoint APEX :

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
v1 = HMAC_SHA256(webhook_secret, `${t}.${event_id}.${corps_brut}`)
```

Rejeter si signature invalide, header malformé, ou `|maintenant − t| > 300 s`.

### 14.2 Idempotence côté récepteur

APEX déduplique par `event_id`. Un `event_id` rejoué renvoie `200 OK` avec
`{ "status": "duplicate" }`.

### 14.3 Politique de retry

| Tentative | Délai après la précédente |
|-----------|---------------------------|
| 1         | immédiat                  |
| 2         | 30 s                      |
| 3         | 2 min                     |
| 4         | 10 min                    |
| 5         | 1 h                       |
| 6         | 8 h                       |

Après 6 tentatives l'événement passe en `dropped` et un événement
`incident_opened` est émis. Replay manuel possible via
`POST /v1/webhooks/{event_id}/replay` (scope `webhooks.replay`).

### 14.4 Taxonomie des événements

| Catégorie         | Événements                                                              |
|-------------------|--------------------------------------------------------------------------|
| KYC               | `kyc_submitted`, `kyc_approved`, `kyc_rejected`, `kyc_resubmit_required`, `document_missing`, `compliance_hold` |
| Client            | `client_created`, `client_updated`, `client_suspended`, `client_closed`  |
| Compte trading    | `trading_account_created`, `trading_account_updated`, `trading_account_disabled`, `leverage_changed`, `password_reset_requested` |
| Dépôt             | `deposit_created`, `deposit_pending`, `deposit_completed`, `deposit_failed`, `deposit_rejected`, `deposit_chargeback`, `deposit_refund` |
| Retrait           | `withdrawal_requested`, `withdrawal_under_review`, `withdrawal_approved`, `withdrawal_processing`, `withdrawal_completed`, `withdrawal_rejected`, `withdrawal_failed` |
| Trading           | `trade_closed`, `daily_volume_ready`, `volume_report_ready`, `account_status_changed` |
| Commission        | `commission_generated`, `commission_adjusted`, `commission_paid`, `monthly_statement_ready` |
| Technique         | `api_error`, `webhook_retry`, `reconciliation_report_ready`, `incident_opened`, `incident_resolved` |

---

## 15 · Sandbox & production

| Élément                          | Sandbox                                | Production                       |
|----------------------------------|----------------------------------------|----------------------------------|
| URL de base                      | `https://sandbox-api.fortuneprime.com/v1` | `https://api.fortuneprime.com/v1` |
| Credentials client               | `apex_sandbox`, `apex_sandbox_secret`  | Émis par FPG ops                 |
| Secret webhook                   | `whsec_sbx_…`                          | `whsec_prod_…`                   |
| Client de test                   | APX-700001 / s.lindqvist+demo@…        | s.o.                             |
| Cartes de test                   | 4242 4242 4242 4242 (succès), 4000 0000 0000 0002 (refusée) | s.o. |
| Wallet crypto de test            | `TXY…` (auto-funded sur POST)          | s.o.                             |
| Rafraîchissement doc             | Quotidien                              | À chaque changement              |
| SLA                              | best effort                            | 99,9 % uptime, p95 < 500 ms      |
| Page de statut                   | `status.fortuneprime.com/sandbox`      | `status.fortuneprime.com`        |

---

## 16 · Glossaire

* **APEX correlation id** — Identifiant généré par APEX pour une requête ou
  entité. Utilisé comme Idempotency-Key dans de nombreux POSTs. Toujours
  retransmis dans les réponses et webhooks.
* **FPG id** — Identifiant canonique assigné par FPG. APEX les stocke mais
  ne les génère jamais.
* **Hosted payment** — Session de paiement où le client interagit directement
  avec la page PSP opérée par FPG. APEX redirige le navigateur et ne voit jamais
  les données carte.
* **Marge libre** — Equity moins margin used. Plafond pour les retraits.
* **Code IB** — Code partenaire « introducing broker ». Celui d'APEX est
  `APEX-IB-01`.

---

**Document maintenu par :** ingénierie APEX. **Dernière mise à jour :** 2026-05-25.
**Contact :** `engineering@apex.com`.
