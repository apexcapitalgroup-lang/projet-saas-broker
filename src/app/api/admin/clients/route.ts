/**
 * GET /api/admin/clients
 *
 * Paginated client list with filters. Admin-only.
 *
 * Query: page, page_size, q, status, kyc, type, ib_code
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
  status: z.string().optional(),
  kyc: z.string().optional(),
  type: z.string().optional(),
  ib_code: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const params: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
    const q = Query.parse(params);
    const db = await getDb();
    let rows = db.clients.slice();
    if (q.status) rows = rows.filter((c) => c.status === q.status);
    if (q.kyc) rows = rows.filter((c) => c.kyc === q.kyc);
    if (q.type) rows = rows.filter((c) => c.type === q.type);
    if (q.ib_code) rows = rows.filter((c) => c.ibCode === q.ib_code);
    if (q.q) {
      const needle = q.q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.apexId.toLowerCase().includes(needle) ||
          (c.fpgId ?? "").toLowerCase().includes(needle) ||
          c.email.toLowerCase().includes(needle) ||
          c.firstName.toLowerCase().includes(needle) ||
          c.lastName.toLowerCase().includes(needle)
      );
    }
    const total = rows.length;
    const start = (q.page - 1) * q.page_size;
    return jsonOk({
      items: rows.slice(start, start + q.page_size).map((c) => ({
        apex_id: c.apexId,
        fpg_id: c.fpgId,
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        country: c.countryOfResidence,
        type: c.type,
        status: c.status,
        kyc: c.kyc,
        ib_code: c.ibCode,
        registered_at: c.createdAt,
        last_activity_at: c.lastActivityAt,
        total_deposits: c.totalDeposits,
        net_deposit: c.netDeposit,
        volume_30d: c.volume30d,
        accounts: c.accountsCount,
      })),
      page: q.page,
      page_size: q.page_size,
      total,
    });
  });
}
