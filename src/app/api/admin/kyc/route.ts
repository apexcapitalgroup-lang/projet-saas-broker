/**
 * GET /api/admin/kyc
 *
 * KYC review queue with tab filters.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { adminGuard } from "@/server/guards";
import { getDb } from "@/server/store";
import { jsonOk, withErrorHandling } from "@/server/http";

const Query = z.object({
  tab: z
    .enum(["queue", "resubmissions", "compliance_hold", "approved_today"])
    .default("queue"),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const guard = await adminGuard();
    if (!guard.ok) return guard.res;
    const params: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
    const { tab } = Query.parse(params);
    const db = await getDb();
    let rows = db.clients.slice();
    if (tab === "queue") {
      rows = rows.filter((c) =>
        ["pending", "under_review", "resubmit_required", "document_missing"].includes(c.kyc)
      );
    } else if (tab === "resubmissions") {
      rows = rows.filter((c) => c.kyc === "resubmit_required");
    } else if (tab === "compliance_hold") {
      rows = rows.filter((c) => c.kyc === "compliance_hold");
    } else if (tab === "approved_today") {
      // Use mock pipeline counter — in real life: filter by today's KYC approval audit entries.
      rows = rows.filter((c) => c.kyc === "approved").slice(0, 11);
    }
    return jsonOk({
      items: rows.map((c) => ({
        apex_id: c.apexId,
        fpg_id: c.fpgId,
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        country: c.countryOfResidence,
        type: c.type,
        kyc_status: c.kyc,
        client_status: c.status,
        registered_at: c.createdAt,
        ib_code: c.ibCode,
      })),
    });
  });
}
