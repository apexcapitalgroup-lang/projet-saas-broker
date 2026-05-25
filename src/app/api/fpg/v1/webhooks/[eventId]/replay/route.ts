/**
 * /api/fpg/v1/webhooks/[eventId]/replay
 *
 * POST — Trigger a manual replay of a previously emitted event.
 *
 * Scope: webhooks.replay
 */

import { NextRequest } from "next/server";
import { audit } from "@/server/audit";
import { fpgError, runFpg, signAndSend } from "@/server/fpg/middleware";
import { replayEvent } from "@/server/webhooks/dispatcher";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  return runFpg(
    req,
    { endpoint: "/v1/webhooks/:eventId/replay", scopes: ["webhooks.replay"] },
    async ({ ctx, finalize }) => {
      const { eventId } = await params;
      const ok = await replayEvent(eventId);
      if (!ok) {
        return fpgError(404, "fpg.event_not_found", `No event with id=${eventId}`, ctx);
      }
      await audit({
        actor: ctx.clientId,
        actorRole: "FPG OAuth client",
        action: "POST /v1/webhooks/:eventId/replay",
        target: eventId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: "success",
        correlationId: ctx.requestId,
      });
      const resp = { event_id: eventId, status: "scheduled" };
      await finalize({ body: resp, status: 202 });
      return signAndSend(resp, ctx, { status: 202 });
    }
  );
}
