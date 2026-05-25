# Contrat webhooks (Français)

Ce document détaille le flux webhook FPG → APEX. L'information est aussi
présente dans le §14 de [`fpg-api-spec-FR.md`](./fpg-api-spec-FR.md).

## Endpoint (réception côté APEX)

```
POST https://api.apex.com/v1/webhooks/fpg
```

Démo locale :

```
POST http://localhost:3000/api/internal/webhooks/fpg
```

## En-têtes

| Header                | Valeur                                                                |
|-----------------------|-----------------------------------------------------------------------|
| `X-FPG-Event-Id`      | Identifiant ULID `evt_01...`                                          |
| `X-FPG-Event-Type`    | Un des event types listés au §14.4 de la spec API                     |
| `X-FPG-Signature`     | `t=<unix-s>, v1=<hex>` — HMAC-SHA256 (voir ci-dessous)                |
| `Content-Type`        | `application/json`                                                    |

## Corps

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
v1 = HMAC_SHA256(secret_webhook, `${t}.${event_id}.${corps_brut}`)
```

Étapes de vérification côté APEX :

1. Parser `X-FPG-Signature` en `{ t, v1 }`.
2. Rejeter si `|maintenant − t| > 300 secondes`.
3. Recalculer `attendu = HMAC_SHA256(secret_webhook, `${t}.${event_id}.${corps_brut}`)`
   et comparer en temps constant avec `v1`. Rejeter en cas d'écart.
4. Dédupliquer par `event_id` (APEX conserve les 5000 derniers).
5. Traiter l'événement de façon idempotente.
6. Retourner `200 OK { "ok": true, "event_id": "..." }` (ou
   `{ "status": "duplicate" }`).

## Politique de retry

Délais entre tentatives (émetteur) :

| Tentative | Délai     |
|-----------|-----------|
| 1         | immédiat  |
| 2         | 30 s      |
| 3         | 2 min     |
| 4         | 10 min    |
| 5         | 1 h       |
| 6         | 8 h       |

Après 6 tentatives l'événement passe `dropped`. L'émetteur émet
`incident_opened` avec payload `{ original_event_id: ... }`.

## Replay

```
POST /v1/webhooks/{event_id}/replay
Authorization: Bearer <token avec webhooks.replay>
Idempotency-Key: <uuid>
```

Retourne `202 { event_id, status: "scheduled" }`.

## Catalogue d'événements

Voir §14.4 de la spec API. 36 types distincts organisés en 8 catégories
(KYC, Client, Compte trading, Dépôt, Retrait, Trading, Commission, Technique).

## Cas d'échec à gérer côté receveur

* **Livraison tardive** — les événements peuvent arriver dans le désordre.
  Utiliser systématiquement `client_apex_id` / `deposit_id` / `withdrawal_id`
  pour relire l'état courant plutôt que se fier à l'ordre.
* **Livraison dupliquée** — la déduplication par `event_id` est obligatoire.
* **Événement contrefait** — la signature est l'unique garde-fou. Ne jamais
  faire confiance au corps avant vérification.
* **Timing attacks** — utiliser une comparaison à temps constant sur le HMAC.

## Visibilité opérationnelle

La page admin `/webhooks` affiche :

* Les 1842+ derniers événements et leur statut (`delivered`, `retry`,
  `dropped`)
* Le résultat de vérification HMAC pour chacun
* La latence par événement (`durationMs`)
* Le débit par heure
* Un bouton `Replay` par événement (appelle l'endpoint ci-dessus)

L'audit log (`/audit`) enregistre chaque réception webhook avec l'acteur
`FPG webhook` et l'issue de vérification.
