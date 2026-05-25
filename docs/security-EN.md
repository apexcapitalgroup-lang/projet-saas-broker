# APEX × FPG — Security model (English)

**Audience: FPG compliance & security. Last update: 2026-05-25.**

This document covers the security controls required by §11 of the cahier des
charges.

---

## 1 · Threat model

We assume:

* APEX and FPG are mutually trusted but separate organisations.
* All client funds are held by FPG; APEX never touches money.
* Network paths between APEX and FPG cross the public Internet.
* The PSP page is operated by FPG; APEX never sees card data.
* Both sides are subject to GDPR; sensitive data is encrypted at rest.

The most concrete failure modes we defend against:

1. Token theft → mitigated by scoped tokens with 24 h TTL, IP allow-list.
2. Replay attacks on the API → mitigated by `Idempotency-Key` + body hash.
3. Replay attacks on webhooks → mitigated by HMAC + 5-min tolerance + dedupe.
4. Man-in-the-middle → mitigated by TLS 1.3, HSTS preload, certificate pinning
   recommended for the FPG egress (out of scope of this codebase).
5. Internal credential leakage → mitigated by short sessions, audit on every
   privileged action, no plaintext secrets logged.

---

## 2 · Transport security

* **TLS 1.3** required for all incoming and outgoing traffic.
* **HSTS** preload (`max-age=63072000; includeSubDomains; preload`).
* **HTTP → HTTPS** redirect at the edge.
* No third-party domains at runtime. Google Fonts are inlined at build via
  `next/font`.

The full security header set is configured in `next.config.ts`:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
X-DNS-Prefetch-Control: off
Content-Security-Policy: default-src 'self'; …
```

---

## 3 · Authentication

### 3.1 Admin console

* Two-step: email + password, then TOTP RFC 6238.
* Passwords hashed with **scrypt** (64-byte derived key), unique 16-byte salt
  per user, constant-time verification.
* TOTP secrets stored per user, ±1 30-second window for clock skew.
* Demo accepts the literal code `123456` to streamline review — this MUST
  be disabled in production.

### 3.2 Client portal

* Email + password, hashed identically.
* 2FA optional for clients (recommended).
* Account lockout after 5 failed attempts in 15 minutes (planned).

### 3.3 Sessions

* HTTP-only, SameSite=Lax, Secure (in production) cookies.
* 45-minute sliding TTL.
* Cookie value is `<sessionId>.<expiresAt>.<HMAC>` signed with
  `APEX_SESSION_SECRET`.
* All active sessions visible from `/security` admin page; admin can revoke
  individual sessions or "Sign out everywhere".

### 3.4 FPG API tokens

* OAuth2 `client_credentials` grant; tokens valid 24 hours.
* Per-`client_id` scope set; missing scopes → `403 fpg.scope_insufficient`.
* Tokens stored in `db.fpgTokens` (in real deployments: short-lived in Redis or
  JWT-based with rotation).

---

## 4 · Authorization

### 4.1 RBAC inside the admin console

| Role                | KYC review | Withdraw approve | Settings edit | Audit log read | API keys |
|---------------------|------------|------------------|---------------|----------------|----------|
| Admin               | ✓          | ✓                | ✓             | ✓              | ✓        |
| Compliance Officer  | ✓          | ✓                | —             | ✓              | —        |
| Operations          | —          | review only      | —             | ✓              | —        |
| Finance             | —          | —                | —             | ✓              | —        |
| Support             | view only  | view only        | —             | ✓              | —        |
| Viewer              | read only  | read only        | —             | read only      | —        |

(Demo seeds one of each role.)

### 4.2 FPG scopes

| Scope                | Endpoints permitted                                                            |
|----------------------|--------------------------------------------------------------------------------|
| `read`               | All `GET`s                                                                     |
| `kyc.upload`         | `POST/GET kyc/documents`, `GET/PATCH kyc/status`                                |
| `accounts.create`    | `POST/PATCH clients`, `POST trading-accounts`, `PATCH leverage`, password reset |
| `payments.initiate`  | `POST deposits/sessions`, `POST withdrawals`, `PATCH withdrawals/{id}`           |
| `reporting`          | volumes, commissions, statements, reconciliation, trades                        |
| `webhooks.replay`    | `POST webhooks/{id}/replay`                                                    |

---

## 5 · Idempotency

Mandatory for all state-changing FPG requests. See §3 of the API spec.

Implementation: `(key, body_sha256, endpoint)` triple stored in
`db.idempotency`. TTL = 24 hours. Mismatch → 409.

---

## 6 · Webhooks

* HMAC-SHA256 signed.
* `t` timestamp + 5-minute tolerance prevents replay.
* `event_id` deduplication prevents double-processing.
* Up to 6 retry attempts with exponential back-off (30 s → 8 h).
* Manual replay via dedicated endpoint.
* Every receive logged in audit trail with signature outcome.

---

## 7 · Audit log

* Append-only (`db.auditLog.unshift`, capped at 5000 rows in demo).
* Recorded on: every login (success / failure), every admin action, every
  webhook receive, every API call by service accounts, every KYC decision,
  every withdrawal decision, every API key rotation, every settings change.
* Production retention: **7 years**.
* Production storage: WORM-capable object store (S3 Object Lock, GCS Bucket
  Lock, etc.).
* Each entry: `at, actor, actorRole, action, target, ip, userAgent, result,
  correlationId, metadata`.

---

## 8 · Encryption at rest

* User passwords: scrypt-hashed (not encrypted).
* KYC document content: planned encrypted blob storage (AES-256-GCM,
  customer-managed key, signed URLs for retrieval).
* Database backups: encrypted, cross-region, 35-day retention.

---

## 9 · Key rotation

* APEX session secret: rotate every 90 days (env `APEX_SESSION_SECRET`).
* FPG OAuth client secret: rotate every 90 days. Both keys accepted for 7 days
  during overlap.
* FPG webhook secret: rotate every 180 days; FPG sends events signed with both
  during the overlap window.
* API keys (admin-issued, scoped): on-demand rotation through the
  `/security` admin page.

---

## 10 · Network controls

* APEX → FPG egress: static IP pair, allow-listed by FPG.
* FPG → APEX webhook ingress: signed; in addition, allow-list FPG IP at the
  edge (WAF).
* WAF: OWASP Top 10 ruleset enforced.
* DDoS: L3 + L7 mitigation, CDN-fronted.
* No SSH access to production from public Internet; bastion + MFA + audit.

---

## 11 · GDPR & data subject rights

* Lawful basis: contract performance (KYC, account, transactions) and legal
  obligation (AML / regulatory).
* DPO appointed (contact: `dpo@apex.com`).
* Right to access: clients can export profile + transactions from
  `/portal/documents` (planned button).
* Right to erasure: subject to AML retention (7 years post-account-closure).
* Cross-border transfer: APEX EU-West / FPG Hong Kong → Standard Contractual
  Clauses + Transfer Impact Assessment in place.

---

## 12 · Certifications & roadmap

| Item              | Status         | ETA               |
|-------------------|----------------|-------------------|
| ISO 27001         | In progress    | Audit Q3 2026     |
| SOC 2 Type II     | Engagement scheduled | Q4 2026 / Q1 2027 |
| GDPR              | Compliant      | DPO appointed     |
| CSPN              | Roadmap        | —                 |
| PCI DSS           | Not applicable | No card data on APEX |
| Penetration test  | Q1 2026 (annual) | Next: Q1 2027    |

---

## 13 · Incident response

* Severity 1 incident (e.g. credential leak, data exfiltration) — paging:
  ops on-call + CISO within 5 minutes.
* SLA targets: detection < 15 min, containment < 1 h, notification to FPG
  < 4 h, post-mortem within 5 business days.
* Public status page: `status.apex.com`.
