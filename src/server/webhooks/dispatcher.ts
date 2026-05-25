/**
 * Webhook dispatcher (FPG mock → APEX ingress).
 *
 * In the demo the FPG mock and APEX run in the same Node process, so
 * "dispatching" means: enqueue a delivery and POST it asynchronously to the
 * configured `apexWebhookUrl` (defaults to /api/internal/webhooks/fpg).
 *
 * Each delivery is:
 *   - Signed with HMAC-SHA256 using FPG_WEBHOOK_SECRET.
 *   - Idempotent by event_id.
 *   - Retried with exponential backoff up to maxAttempts.
 *
 * The dispatcher persists the event to db.webhookEvents and updates delivery
 * state as it progresses.
 */

import { newEventId, newId } from "@/lib/ids";
import { signWebhook } from "@/server/crypto";
import { tx, getDb } from "@/server/store";
import type {
  WebhookDeliveryStatus,
  WebhookEvent,
  WebhookEventType,
} from "@/server/types";

const SECRET = process.env.FPG_WEBHOOK_SECRET ?? "fpg-webhook-secret-DEV-CHANGE-ME";

const RETRY_DELAYS_MS = [
  30_000, // 30s
  2 * 60_000, // 2 min
  10 * 60_000, // 10 min
  60 * 60_000, // 1 h
  8 * 60 * 60_000, // 8 h
];

interface DispatchOpts {
  clientApexId?: string;
  clientFpgId?: string;
  /** Override the simulated delay before first delivery (ms) */
  delayMs?: number;
  /** Pre-built event id (otherwise generated) */
  eventId?: string;
}

export async function dispatchEvent(
  type: WebhookEventType,
  payload: Record<string, unknown>,
  opts: DispatchOpts = {}
): Promise<WebhookEvent> {
  const db = await getDb();
  const eventId = opts.eventId ?? newEventId();
  const now = new Date().toISOString();
  const event: WebhookEvent = {
    id: newId("wh"),
    eventId,
    type,
    payload,
    clientApexId: opts.clientApexId,
    clientFpgId: opts.clientFpgId,
    createdAt: now,
    status: "pending",
    attempts: 0,
    maxAttempts: RETRY_DELAYS_MS.length,
    signature: "(pending)",
    nextAttemptAt: new Date(Date.now() + (opts.delayMs ?? db.config.webhookDispatchDelayMs)).toISOString(),
  };
  await tx(async (d) => {
    d.webhookEvents.unshift(event);
    if (d.webhookEvents.length > 5000) d.webhookEvents.length = 5000;
  });
  // Schedule asynchronous delivery
  setTimeout(() => {
    void attemptDelivery(eventId);
  }, opts.delayMs ?? db.config.webhookDispatchDelayMs);
  return event;
}

async function attemptDelivery(eventId: string): Promise<void> {
  const db = await getDb();
  const event = db.webhookEvents.find((e) => e.eventId === eventId);
  if (!event) return;
  if (event.status === "delivered" || event.status === "dropped") return;

  const apexWebhookUrl = db.config.apexWebhookUrl;
  const tsSec = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    id: event.eventId,
    type: event.type,
    created_at: event.createdAt,
    client_apex_id: event.clientApexId ?? null,
    client_fpg_id: event.clientFpgId ?? null,
    data: event.payload,
  });
  const signature = signWebhook(tsSec, event.eventId, body, SECRET);

  const start = Date.now();
  let status: WebhookDeliveryStatus = "delivered";
  let responseStatus = 0;
  try {
    const res = await fetch(apexWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FPG-Signature": signature,
        "X-FPG-Event-Id": event.eventId,
        "X-FPG-Event-Type": event.type,
      },
      body,
      // Avoid Next.js caching of POSTs in dev (some routes may set caches)
      cache: "no-store",
    });
    responseStatus = res.status;
    if (res.status < 200 || res.status >= 300) {
      status = "retry";
    }
  } catch {
    status = "retry";
    responseStatus = 0;
  }
  const duration = Date.now() - start;

  await tx(async (d) => {
    const e = d.webhookEvents.find((x) => x.eventId === eventId);
    if (!e) return;
    e.attempts += 1;
    e.signature = signature;
    e.lastAttemptAt = new Date().toISOString();
    e.durationMs = duration;
    e.responseStatus = responseStatus;
    if (status === "delivered") {
      e.status = "delivered";
      e.nextAttemptAt = undefined;
    } else if (e.attempts >= e.maxAttempts) {
      e.status = "dropped";
      e.nextAttemptAt = undefined;
    } else {
      e.status = "retry";
      const delay = RETRY_DELAYS_MS[Math.min(e.attempts, RETRY_DELAYS_MS.length - 1)];
      e.nextAttemptAt = new Date(Date.now() + delay).toISOString();
      // schedule next retry
      setTimeout(() => {
        void attemptDelivery(eventId);
      }, delay);
    }
  });
}

/**
 * Manual replay of a known event. Resets delivery status to retry and
 * schedules an immediate attempt.
 */
export async function replayEvent(eventId: string): Promise<boolean> {
  let found = false;
  await tx(async (d) => {
    const e = d.webhookEvents.find((x) => x.eventId === eventId);
    if (!e) return;
    e.attempts = 0;
    e.status = "pending";
    e.nextAttemptAt = new Date().toISOString();
    found = true;
  });
  if (found) {
    setTimeout(() => {
      void attemptDelivery(eventId);
    }, 50);
  }
  return found;
}
