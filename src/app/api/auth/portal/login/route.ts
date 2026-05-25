import { NextRequest } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { createSession, writeSessionCookie } from "@/server/auth";
import { verifyPassword } from "@/server/crypto";
import { findClientByEmail } from "@/server/store";
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

    const client = await findClientByEmail(email);
    if (!client) {
      await audit({
        actor: email,
        actorRole: "Client",
        action: "Failed portal login (no user)",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "auth.invalid_credentials", "Invalid email or password");
    }

    if (client.status === "suspended" || client.status === "closed") {
      await audit({
        actor: `${client.firstName} ${client.lastName}`,
        actorRole: "Client",
        action: "Login blocked (status)",
        target: client.apexId,
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(403, "auth.account_suspended", "Account suspended — contact support");
    }

    if (!verifyPassword(password, client.passwordHash, client.passwordSalt)) {
      await audit({
        actor: `${client.firstName} ${client.lastName}`,
        actorRole: "Client",
        action: "Failed portal login (bad password)",
        target: client.apexId,
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "auth.invalid_credentials", "Invalid email or password");
    }

    const session = await createSession({
      kind: "client",
      refId: client.id,
      twoFactorVerified: true, // portal: no admin 2FA required for demo
      ip,
      userAgent,
    });
    await writeSessionCookie(session);
    await audit({
      actor: `${client.firstName} ${client.lastName}`,
      actorRole: "Client",
      action: "Logged in to client portal",
      target: client.apexId,
      ip,
      userAgent,
      result: "success",
    });
    return jsonOk({
      ok: true,
      profile: {
        apexId: client.apexId,
        fpgId: client.fpgId,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        type: client.type,
        status: client.status,
        kyc: client.kyc,
      },
    });
  });
}
