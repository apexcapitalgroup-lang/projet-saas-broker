/**
 * Webhook ingress: FPG → APEX.
 *
 * - Verifies HMAC-SHA256 signature with X-FPG-Signature header.
 * - Rejects events older than 5 minutes (replay protection).
 * - Deduplicates by event_id (idempotent processing).
 * - Dispatches to the appropriate handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { verifyWebhookSignature } from "@/server/crypto";
import { handleEvent } from "@/server/webhooks/handlers";
import { findWebhookByEventId, tx } from "@/server/store";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  withErrorHandling,
} from "@/server/http";

const SECRET = process.env.FPG_WEBHOOK_SECRET ?? "fpg-webhook-secret-DEV-CHANGE-ME";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-fpg-signature");
    const eventId = req.headers.get("x-fpg-event-id");
    const eventType = req.headers.get("x-fpg-event-type");

    if (!signatureHeader || !eventId) {
      await audit({
        actor: "FPG webhook",
        actorRole: "External",
        action: "webhook.malformed_headers",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(400, "webhook.malformed", "Missing X-FPG-Signature or X-FPG-Event-Id");
    }

    const verification = verifyWebhookSignature(signatureHeader, eventId, rawBody, SECRET);
    if (!verification.ok) {
      await audit({
        actor: "FPG webhook",
        actorRole: "External",
        action: `webhook.signature_${verification.reason}`,
        target: eventId,
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, `webhook.signature_${verification.reason}`, "Invalid webhook signature");
    }

    // Idempotency by event_id
    const existing = await findWebhookByEventId(eventId);
    if (existing && existing.status === "delivered") {
      // Already processed
      return jsonOk({ ok: true, status: "duplicate", event_id: eventId });
    }

    // Process the event
    let payload: { type?: string; data?: Record<string, unknown> } = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonError(400, "webhook.invalid_json", "Webhook body is not valid JSON");
    }
    const type = (payload.type ?? eventType ?? "") as string;
    await handleEvent(type as Parameters<typeof handleEvent>[0], payload.data ?? {});

    // Mark as delivered in our store (the dispatcher creates the record;
    // here we just confirm receipt for events that arrived directly)
    await tx(async (db) => {
      const e = db.webhookEvents.find((x) => x.eventId === eventId);
      if (e) {
        e.status = "delivered";
        e.lastAttemptAt = new Date().toISOString();
        e.responseStatus = 200;
      }
    });

    await audit({
      actor: "FPG webhook",
      actorRole: "External",
      action: type,
      target: eventId,
      ip,
      userAgent,
      result: "success",
    });

    return jsonOk({ ok: true, event_id: eventId });
  });
}

// Reject any non-POST method
export async function GET() {
  return NextResponse.json(
    { error: { code: "method.not_allowed", message: "Use POST" } },
    { status: 405, headers: { Allow: "POST" } }
  );
}
