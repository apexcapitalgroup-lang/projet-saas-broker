# APEX × FPG — Modèle de sécurité (Français)

**Destinataires : conformité & sécurité FPG. Dernière mise à jour : 2026-05-25.**

Ce document détaille les contrôles requis par le §11 du cahier des charges.

---

## 1 · Modèle de menace

Hypothèses :

* APEX et FPG sont deux organisations distinctes en confiance mutuelle.
* Tous les fonds clients sont détenus par FPG ; APEX ne manipule jamais de
  fonds.
* Les chemins réseau APEX ↔ FPG traversent Internet public.
* La page PSP est opérée par FPG ; APEX ne voit jamais les données carte.
* Les deux parties sont soumises au RGPD ; les données sensibles sont chiffrées
  au repos.

Vecteurs de défense principaux :

1. Vol de token → atténué par scopes, TTL 24 h, IP allow-list.
2. Replay API → atténué par `Idempotency-Key` + hash de body.
3. Replay webhook → atténué par HMAC + tolérance 5 min + déduplication.
4. Man-in-the-middle → atténué par TLS 1.3, HSTS preload, pinning recommandé
   sur le trafic sortant APEX.
5. Fuite interne de credentials → atténué par sessions courtes, audit sur
   chaque action privilégiée, jamais de secret en clair dans les logs.

---

## 2 · Sécurité de transport

* **TLS 1.3** obligatoire entrant et sortant.
* **HSTS** preload (`max-age=63072000; includeSubDomains; preload`).
* Redirection HTTP → HTTPS à l'edge.
* Aucun domaine tiers en runtime. Google Fonts est inliné au build via
  `next/font`.

Headers de sécurité configurés dans `next.config.ts` :

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

## 3 · Authentification

### 3.1 Console admin

* Deux étapes : email + mot de passe, puis TOTP RFC 6238.
* Hash de mot de passe via **scrypt** (clé dérivée 64 octets), salt unique 16
  octets par utilisateur, comparaison à temps constant.
* Secrets TOTP par utilisateur, fenêtre ±1 de 30 s pour la dérive d'horloge.
* La démo accepte le code littéral `123456` pour faciliter la revue — à
  désactiver en production.

### 3.2 Portail client

* Email + mot de passe, hash identique.
* 2FA optionnel (recommandé).
* Verrouillage du compte après 5 échecs en 15 min (prévu).

### 3.3 Sessions

* Cookies HTTP-only, SameSite=Lax, Secure en prod.
* TTL glissant 45 min.
* Valeur cookie = `<sessionId>.<expiresAt>.<HMAC>` signé par
  `APEX_SESSION_SECRET`.
* Sessions actives visibles dans `/security` ; révocation par session ou
  globale.

### 3.4 Tokens API FPG

* Grant OAuth2 `client_credentials` ; tokens valides 24 h.
* Set de scopes par `client_id` ; absence de scope → `403
  fpg.scope_insufficient`.
* Tokens stockés en `db.fpgTokens` (en prod : Redis court-vivant ou JWT
  avec rotation).

---

## 4 · Autorisation

### 4.1 RBAC console admin

| Rôle                 | Revue KYC | Approbation retrait | Édition Settings | Audit log | API keys |
|----------------------|-----------|---------------------|------------------|-----------|----------|
| Admin                | ✓         | ✓                   | ✓                | ✓         | ✓        |
| Compliance Officer   | ✓         | ✓                   | —                | ✓         | —        |
| Operations           | —         | revue seule         | —                | ✓         | —        |
| Finance              | —         | —                   | —                | ✓         | —        |
| Support              | lecture   | lecture             | —                | ✓         | —        |
| Viewer               | lecture   | lecture             | —                | lecture   | —        |

(La démo crée un compte pour chaque rôle.)

### 4.2 Scopes FPG

| Scope                | Endpoints autorisés                                                          |
|----------------------|------------------------------------------------------------------------------|
| `read`               | Tous les `GET`                                                               |
| `kyc.upload`         | `POST/GET kyc/documents`, `GET/PATCH kyc/status`                              |
| `accounts.create`    | `POST/PATCH clients`, `POST trading-accounts`, `PATCH leverage`, reset password|
| `payments.initiate`  | `POST deposits/sessions`, `POST withdrawals`, `PATCH withdrawals/{id}`         |
| `reporting`          | volumes, commissions, statements, réconciliation, trades                       |
| `webhooks.replay`    | `POST webhooks/{id}/replay`                                                  |

---

## 5 · Idempotence

Obligatoire sur toutes les requêtes FPG à effet d'état. Voir §3 de la spec API.

Implémentation : triplet `(clé, body_sha256, endpoint)` stocké en
`db.idempotency`. TTL = 24 h. Mismatch → 409.

---

## 6 · Webhooks

* Signés HMAC-SHA256.
* Timestamp `t` + tolérance 5 min anti-replay.
* Déduplication par `event_id`.
* Jusqu'à 6 tentatives avec back-off exponentiel (30 s → 8 h).
* Replay manuel via endpoint dédié.
* Chaque réception loguée avec résultat de signature.

---

## 7 · Audit log

* Append-only (`db.auditLog.unshift`, capé à 5000 lignes en démo).
* Enregistré sur : chaque login (succès / échec), chaque action admin, chaque
  réception webhook, chaque appel API par service account, chaque décision
  KYC, chaque décision de retrait, chaque rotation API key, chaque
  modification de settings.
* Rétention en prod : **7 ans**.
* Stockage en prod : objet store WORM (S3 Object Lock, GCS Bucket Lock, etc.).
* Chaque entrée : `at, actor, actorRole, action, target, ip, userAgent,
  result, correlationId, metadata`.

---

## 8 · Chiffrement au repos

* Mots de passe utilisateurs : hash scrypt (pas chiffré).
* Contenu des documents KYC : stockage chiffré prévu (AES-256-GCM, clé
  customer-managed, URLs signées).
* Backups DB : chiffrés, cross-region, rétention 35 jours.

---

## 9 · Rotation des secrets

* Secret de session APEX : rotation tous les 90 jours (env
  `APEX_SESSION_SECRET`).
* Secret OAuth client FPG : rotation tous les 90 jours. Les deux clés sont
  acceptées sur une fenêtre de 7 jours.
* Secret webhook FPG : rotation tous les 180 jours ; FPG envoie les événements
  signés avec les deux secrets durant la fenêtre.
* API keys (émises par admin, scopées) : rotation à la demande depuis la page
  `/security`.

---

## 10 · Contrôles réseau

* Sortie APEX → FPG : paire d'IP statiques, allow-listée par FPG.
* Entrée FPG → APEX (webhook) : signée ; en complément allow-list IP FPG à
  l'edge (WAF).
* WAF : OWASP Top 10 forcé.
* DDoS : mitigation L3 + L7, CDN en façade.
* Aucun accès SSH à la prod depuis Internet ; bastion + MFA + audit.

---

## 11 · RGPD & droits des personnes

* Base légale : exécution du contrat (KYC, compte, transactions) et obligation
  légale (AML / réglementaire).
* DPO nommé (contact : `dpo@apex.com`).
* Droit d'accès : les clients exportent profil + transactions depuis
  `/portal/documents` (bouton prévu).
* Droit à l'effacement : soumis à la rétention AML (7 ans après clôture).
* Transferts hors UE : APEX EU-West / FPG Hong Kong → Clauses Contractuelles
  Types + Transfer Impact Assessment en place.

---

## 12 · Certifications & roadmap

| Élément            | Statut         | ETA                  |
|--------------------|----------------|----------------------|
| ISO 27001          | En cours       | Audit T3 2026        |
| SOC 2 Type II      | Engagement programmé | T4 2026 / T1 2027 |
| RGPD               | Conforme       | DPO nommé            |
| CSPN               | Roadmap        | —                    |
| PCI DSS            | Non applicable | Aucune donnée carte chez APEX |
| Test d'intrusion   | T1 2026 (annuel)| Prochain : T1 2027   |

---

## 13 · Réponse aux incidents

* Incident sévérité 1 (fuite credentials, exfiltration) — escalade : ops
  on-call + RSSI sous 5 min.
* Cibles SLA : détection < 15 min, contention < 1 h, notification FPG
  < 4 h, post-mortem sous 5 jours ouvrés.
* Page de statut publique : `status.apex.com`.
