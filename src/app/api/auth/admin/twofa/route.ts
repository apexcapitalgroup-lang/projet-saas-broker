import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  elevateToTwoFactor,
  getCurrentSession,
  writeSessionCookie,
} from "@/server/auth";
import { verifyTotp } from "@/server/crypto";
import { getDb } from "@/server/store";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";

const Body = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const { code } = parsed.data;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const cur = await getCurrentSession();
    if (!cur || cur.kind !== "admin") {
      return jsonError(401, "auth.no_session", "No pending admin session");
    }
    const member = cur.user;

    if (!verifyTotp(member.totpSecret, code, { acceptDemoCode: true })) {
      await audit({
        actor: member.name,
        actorRole: member.role,
        action: "Failed 2FA challenge",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "auth.invalid_totp", "Invalid verification code");
    }

    const elevated = await elevateToTwoFactor(cur.session.id);
    if (!elevated) {
      return jsonError(500, "auth.session_lost", "Session could not be updated");
    }
    await writeSessionCookie(elevated);

    // Update last seen on the team member
    const db = await getDb();
    const tm = db.teamMembers.find((m) => m.id === member.id);
    if (tm) tm.lastSeenAt = new Date().toISOString();

    await audit({
      actor: member.name,
      actorRole: member.role,
      action: "Logged in (TOTP verified)",
      ip,
      userAgent,
      result: "success",
    });
    return jsonOk({
      ok: true,
      user: { name: member.name, role: member.role, email: member.email },
    });
  });
}
