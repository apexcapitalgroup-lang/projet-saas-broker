/**
 * GET /api/admin/webhooks
 *
 * Live webhook event log. Admin-only.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/server/guards";
import { getDb } from "@/server/store";
import { jsonOk, withErrorHandling } from "@/server/http";

const Query = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
  type: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const sp: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((v, k) => (sp[k] = v));
    const q = Query.parse(sp);
    const db = await getDb();
    let rows = db.webhookEvents.slice();
    if (q.type) rows = rows.filter((w) => w.type === q.type);
    if (q.status) rows = rows.filter((w) => w.status === q.status);
    const total = rows.length;
    const start = (q.page - 1) * q.page_size;
    return jsonOk({
      items: rows.slice(start, start + q.page_size).map((w) => ({
        id: w.id,
        event_id: w.eventId,
        type: w.type,
        payload: w.payload,
        client_apex_id: w.clientApexId,
        client_fpg_id: w.clientFpgId,
        status: w.status,
        attempts: w.attempts,
        max_attempts: w.maxAttempts,
        signature: w.signature,
        duration_ms: w.durationMs,
        response_status: w.responseStatus,
        created_at: w.createdAt,
        last_attempt_at: w.lastAttemptAt,
        next_attempt_at: w.nextAttemptAt,
      })),
      page: q.page,
      page_size: q.page_size,
      total,
      counters: {
        delivered: db.webhookEvents.filter((w) => w.status === "delivered").length,
        retry: db.webhookEvents.filter((w) => w.status === "retry").length,
        dropped: db.webhookEvents.filter((w) => w.status === "dropped").length,
        pending: db.webhookEvents.filter((w) => w.status === "pending").length,
      },
    });
  });
}
