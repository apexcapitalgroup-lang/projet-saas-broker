/**
 * POST /api/admin/webhooks/[eventId]/replay
 *
 * Admin-only manual replay of an event.
 */

import { NextRequest } from "next/server";
import { audit } from "@/server/audit";
import { adminGuard } from "@/server/guards";
import { replayEvent } from "@/server/webhooks/dispatcher";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  withErrorHandling,
} from "@/server/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const { eventId } = await params;
    const ok = await replayEvent(eventId);
    if (!ok) return jsonError(404, "webhook.not_found", `No event with id=${eventId}`);
    await audit({
      actor: guard.session.user.name,
      actorRole: guard.session.user.role,
      action: "Triggered webhook replay",
      target: eventId,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
      result: "success",
    });
    return jsonOk({ event_id: eventId, status: "scheduled" });
  });
}
