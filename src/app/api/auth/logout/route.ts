import { NextRequest } from "next/server";
import { audit } from "@/server/audit";
import {
  clearSessionCookie,
  getCurrentSession,
  revokeSession,
} from "@/server/auth";
import {
  getClientIp,
  getUserAgent,
  jsonOk,
  withErrorHandling,
} from "@/server/http";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const cur = await getCurrentSession();
    if (cur) {
      await revokeSession(cur.session.id);
      await audit({
        actor:
          cur.kind === "admin"
            ? cur.user.name
            : `${cur.user.firstName} ${cur.user.lastName}`,
        actorRole: cur.kind === "admin" ? cur.user.role : "Client",
        action: "Logged out",
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
        result: "success",
      });
    }
    await clearSessionCookie();
    return jsonOk({ ok: true });
  });
}
