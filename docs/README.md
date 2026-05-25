# Documentation index · Sommaire

> All documents below describe the **APEX × FPG integration**. Bilingual.
> Tous les documents ci-dessous décrivent l'**intégration APEX × FPG**. Bilingues.

---

## EN — for FPG engineering, ops, compliance

| Document                                                | What you'll find                                                 |
|---------------------------------------------------------|------------------------------------------------------------------|
| [`fpg-api-spec-EN.md`](./fpg-api-spec-EN.md)            | The full API contract FPG must implement. 16 endpoints, OAuth, idempotency, signatures, error codes, scopes, rate limits. The authoritative document. |
| [`security-EN.md`](./security-EN.md)                    | Security model: TLS, auth, RBAC, idempotency, webhooks, audit log, encryption at rest, key rotation, certifications roadmap. |
| [`architecture.md`](./architecture.md)                  | Component diagram, request/response flows, source tree.          |
| [`operational-runbook.md`](./operational-runbook.md)    | How to seed, reset, run the smoke test, simulate failures, replay webhooks, rotate secrets. |

---

## FR — pour les équipes FPG

| Document                                                | Contenu                                                          |
|---------------------------------------------------------|------------------------------------------------------------------|
| [`fpg-api-spec-FR.md`](./fpg-api-spec-FR.md)            | Contrat API complet à implémenter par FPG. 16 endpoints, OAuth, idempotence, signatures, codes d'erreur, scopes, rate limits. Document de référence. |
| [`security-FR.md`](./security-FR.md)                    | Modèle de sécurité : TLS, auth, RBAC, idempotence, webhooks, audit, chiffrement au repos, rotation des clés, roadmap certifications. |
| [`architecture.md`](./architecture.md)                  | Diagramme des composants, flux de requêtes, arborescence.        |
| [`operational-runbook.md`](./operational-runbook.md)    | Seeder, reset, smoke test, simulation de pannes, replay webhooks, rotation secrets. |

---

## Quick start

```bash
pnpm install
pnpm dev                 # http://localhost:3000
bash scripts/smoke.sh    # run the 12 §15.2 acceptance tests
```

Demo credentials (admin): `ariane.m@apex-ops.com` / `ApexDemo!2026` / 2FA `123456`.
Demo credentials (client): `s.lindqvist@northforest.io` / `TraderDemo!2026`.

---

## Repository pointers

* Frontend Admin Console : `src/app/(app)/*`
* Client Portal: `src/app/(portal)/portal/*`
* FPG mock implementation: `src/app/api/fpg/v1/*`
* Webhook dispatcher/handlers: `src/server/webhooks/*`
* Data layer & seed: `src/server/store.ts`, `src/server/seed.ts`
* Auth, sessions, guards: `src/server/auth.ts`, `src/server/guards.ts`, `src/middleware.ts`
* Security headers: `next.config.ts`
