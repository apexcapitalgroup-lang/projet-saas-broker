/**
 * GET /api/admin/audit
 *
 * Audit log feed.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/server/guards";
import { getDb } from "@/server/store";
import { jsonOk, withErrorHandling } from "@/server/http";

const Query = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().optional(),
  result: z.enum(["success", "failure"]).optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const sp: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((v, k) => (sp[k] = v));
    const q = Query.parse(sp);
    const db = await getDb();
    let rows = db.auditLog.slice();
    if (q.result) rows = rows.filter((r) => r.result === q.result);
    if (q.q) {
      const needle = q.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.actor.toLowerCase().includes(needle) ||
          r.action.toLowerCase().includes(needle) ||
          (r.target ?? "").toLowerCase().includes(needle) ||
          r.ip.includes(needle)
      );
    }
    const total = rows.length;
    const start = (q.page - 1) * q.page_size;
    return jsonOk({
      items: rows.slice(start, start + q.page_size),
      page: q.page,
      page_size: q.page_size,
      total,
    });
  });
}
