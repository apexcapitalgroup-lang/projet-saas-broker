/**
 * POST /api/fpg/v1/oauth/token
 *
 * OAuth2 client_credentials grant.
 *
 * Request:
 *   { "grant_type": "client_credentials",
 *     "client_id": "...", "client_secret": "...",
 *     "scope": "read kyc.upload accounts.create payments.initiate reporting" }
 *
 * Response (200):
 *   { "access_token": "fpg_...", "token_type": "Bearer",
 *     "expires_in": 86400, "scope": "..." }
 *
 * Response (401):
 *   { "error": "invalid_client", "error_description": "..." }
 *
 * This endpoint is unauthenticated by design (the grant itself authenticates).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { newCorrelationId } from "@/lib/ids";
import { audit } from "@/server/audit";
import {
  FPG_DEMO_ALLOWED_SCOPES,
  verifyClientCredentials,
} from "@/server/fpg/credentials";
import { issueToken } from "@/server/fpg/tokens";
import {
  getClientIp,
  getUserAgent,
  jsonError,
  jsonOk,
  withErrorHandling,
} from "@/server/http";
import type { ApiKeyScope } from "@/server/types";

const Body = z.object({
  grant_type: z.literal("client_credentials"),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  scope: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const requestId = newCorrelationId("req");
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // OAuth2 standard supports both JSON and form-urlencoded bodies. We accept both.
    let raw: unknown;
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      raw = Object.fromEntries(params.entries());
    } else {
      try {
        raw = await req.json();
      } catch {
        return jsonError(400, "request.invalid_json", "Body must be valid JSON", { requestId });
      }
    }
    const parsed = Body.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "invalid_request", "grant_type, client_id and client_secret are required", {
        requestId,
        details: parsed.error.issues,
      });
    }
    const b = parsed.data;
    if (!verifyClientCredentials(b.client_id, b.client_secret)) {
      await audit({
        actor: b.client_id,
        actorRole: "FPG OAuth client",
        action: "Failed FPG token request",
        ip,
        userAgent,
        result: "failure",
      });
      return jsonError(401, "invalid_client", "Invalid client credentials", {
        requestId,
        headers: { "WWW-Authenticate": 'Bearer realm="fpg"' },
      });
    }

    // Parse requested scopes; fall back to all allowed
    const requested = (b.scope ?? FPG_DEMO_ALLOWED_SCOPES.join(" ")).split(/\s+/).filter(Boolean);
    const granted = requested.filter((s) =>
      (FPG_DEMO_ALLOWED_SCOPES as string[]).includes(s)
    ) as ApiKeyScope[];

    const token = await issueToken(b.client_id, granted, ip);
    const expiresIn = Math.max(
      0,
      Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000)
    );
    await audit({
      actor: b.client_id,
      actorRole: "FPG OAuth client",
      action: "Issued FPG access token",
      target: token.accessToken.slice(0, 12) + "…",
      ip,
      userAgent,
      result: "success",
    });
    return jsonOk(
      {
        access_token: token.accessToken,
        token_type: "Bearer",
        expires_in: expiresIn,
        scope: granted.join(" "),
      },
      { headers: { "x-request-id": requestId, "cache-control": "no-store" } }
    );
  });
}
