import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import {
  createSession,
  writeSessionCookie,
} from "@/server/auth";
import { verifyPassword } from "@/server/crypto";
import { findTeamMemberByEmail } from "@/server/store";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  readJson,
  withErrorHandling,
} from "@/server/http";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const parsed = await readJson(req, Body);
    if ("error" in parsed) return parsed.error;
    const { email, password } = parsed.data;
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const member = await findTeamMemberByEmail(email);
    if (!member || member.status !== "active") {
      await audit({
        actor: email,
        actorRole: "—",
        action: "Failed admin login (no user)",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "auth.invalid_credentials", "Invalid email or password");
    }

    if (!verifyPassword(password, member.passwordHash, member.passwordSalt)) {
      await audit({
        actor: member.email,
        actorRole: member.role,
        action: "Failed admin login (bad password)",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "auth.invalid_credentials", "Invalid email or password");
    }

    const session = await createSession({
      kind: "admin",
      refId: member.id,
      twoFactorVerified: false,
      ip,
      userAgent,
    });
    await writeSessionCookie(session);
    await audit({
      actor: member.name,
      actorRole: member.role,
      action: "Logged in (password verified, awaiting 2FA)",
      ip,
      userAgent,
      result: "success",
    });
    return jsonOk({
      next: "twofa",
      user: { name: member.name, role: member.role, email: member.email },
      session_expires_at: session.expiresAt,
    });
  });
}
