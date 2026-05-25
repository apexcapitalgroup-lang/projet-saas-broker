/**
 * FPG mock API middleware helpers.
 *
 * These wrap a Next.js route handler with the cross-cutting concerns
 * required by §11 (Security) and §15 (API contract):
 *   - Bearer token validation + scope enforcement
 *   - Idempotency-Key support (cache + replay)
 *   - HMAC response signing
 *   - Rate limit headers
 *   - Standard error envelope
 *   - Request-id correlation
 */

import { NextRequest, NextResponse } from "next/server";
import { newCorrelationId } from "@/lib/ids";
import { signWebhook } from "@/server/crypto";
import {
  getClientIp,
  getUserAgent,
  jsonError,
} from "@/server/http";
import { FPG_HMAC_SECRET } from "./credentials";
import {
  hashBody,
  lookupIdempotency,
} from "./idempotency";
import { verifyToken } from "./tokens";
import type { ApiKeyScope } from "@/server/types";

export interface FpgAuthContext {
  clientId: string;
  scopes: ApiKeyScope[];
  ip: string;
  userAgent: string;
  requestId: string;
}

/* -------------------------------------------------------------------------- */
/*  Bearer auth + scope enforcement                                            */
/* -------------------------------------------------------------------------- */

export async function authenticate(
  req: NextRequest,
  required: ApiKeyScope[]
): Promise<{ ok: true; ctx: FpgAuthContext } | { ok: false; res: NextResponse }> {
  const requestId = req.headers.get("x-request-id") ?? newCorrelationId("req");
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      ok: false,
      res: jsonError(401, "fpg.missing_bearer", "Authorization: Bearer <token> required", {
        requestId,
      }),
    };
  }
  const verification = await verifyToken(match[1]);
  if (!verification.valid) {
    const code =
      verification.reason === "expired"
        ? "fpg.token_expired"
        : "fpg.invalid_token";
    return {
      ok: false,
      res: jsonError(401, code, "Invalid or expired access token", { requestId }),
    };
  }
  const { token } = verification;
  const missing = required.filter((s) => !token.scopes.includes(s));
  if (missing.length > 0) {
    return {
      ok: false,
      res: jsonError(403, "fpg.scope_insufficient", `Missing scopes: ${missing.join(", ")}`, {
        requestId,
        details: { required, granted: token.scopes },
      }),
    };
  }
  return {
    ok: true,
    ctx: {
      clientId: token.clientId,
      scopes: token.scopes,
      ip,
      userAgent,
      requestId,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Idempotency wrapper                                                        */
/* -------------------------------------------------------------------------- */

export interface IdempotencyResolution {
  proceed: true;
  rawBody: string;
  parsedBody: unknown;
  finalize: (
    response: { body: unknown; status: number; headers?: Record<string, string> }
  ) => Promise<void>;
}

export async function handleIdempotency(
  req: NextRequest,
  endpoint: string,
  ctx: FpgAuthContext
): Promise<
  | IdempotencyResolution
  | { hit: true; res: NextResponse }
  | { error: NextResponse }
> {
  const key = req.headers.get("idempotency-key");
  const rawBody = await req.text();
  let parsedBody: unknown = null;
  if (rawBody.length > 0) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return {
        error: jsonError(400, "request.invalid_json", "Body must be valid JSON", {
          requestId: ctx.requestId,
        }),
      };
    }
  }

  // POST/PATCH/DELETE: idempotency key is mandatory
  if (req.method !== "GET" && !key) {
    return {
      error: jsonError(
        400,
        "fpg.idempotency_key_required",
        "Header Idempotency-Key is required for state-changing requests",
        { requestId: ctx.requestId }
      ),
    };
  }

  if (!key) {
    return {
      proceed: true,
      rawBody,
      parsedBody,
      finalize: async () => {
        // no key, nothing to record
      },
    };
  }

  const bodyHash = hashBody(rawBody);
  const lookup = await lookupIdempotency(key, endpoint, bodyHash);
  if ("conflict" in lookup) {
    const code =
      lookup.reason === "body_mismatch"
        ? "fpg.idempotency_mismatch"
        : "fpg.idempotency_endpoint_mismatch";
    return {
      error: jsonError(
        409,
        code,
        "Idempotency-Key was reused with a different body or endpoint",
        { requestId: ctx.requestId }
      ),
    };
  }
  if ("hit" in lookup && lookup.hit) {
    const res = NextResponse.json(lookup.body, {
      status: lookup.status,
      headers: {
        ...lookup.headers,
        "x-fpg-idempotent-replay": "true",
        "x-request-id": ctx.requestId,
      },
    });
    return { hit: true, res };
  }

  // miss
  if (!("hit" in lookup) || lookup.hit === false) {
    return {
      proceed: true,
      rawBody,
      parsedBody,
      finalize: async ({ body, status, headers }) => {
        if (!("hit" in lookup) || lookup.hit === false) {
          await lookup.record(body, status, headers);
        }
      },
    };
  }
  // unreachable
  return {
    error: jsonError(500, "fpg.idempotency.internal", "Idempotency internal error", {
      requestId: ctx.requestId,
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Response signing & standard headers                                        */
/* -------------------------------------------------------------------------- */

export function signAndSend(
  body: unknown,
  ctx: FpgAuthContext,
  opts: { status?: number; extraHeaders?: Record<string, string> } = {}
): NextResponse {
  const status = opts.status ?? 200;
  const rawBody = JSON.stringify(body);
  const tsSec = Math.floor(Date.now() / 1000);
  const signature = signWebhook(tsSec, ctx.requestId, rawBody, FPG_HMAC_SECRET);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-request-id": ctx.requestId,
    "x-fpg-signature": signature,
    "x-fpg-api-version": "1.0",
    "x-ratelimit-limit": "1000",
    "x-ratelimit-remaining": "999",
    "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
    ...opts.extraHeaders,
  };
  return new NextResponse(rawBody, { status, headers });
}

export function fpgError(
  status: number,
  code: string,
  message: string,
  ctx: FpgAuthContext,
  extra: { details?: unknown; field?: string } = {}
): NextResponse {
  return signAndSend(
    {
      error: {
        code,
        message,
        field: extra.field,
        details: extra.details,
      },
      request_id: ctx.requestId,
    },
    ctx,
    { status }
  );
}

/* -------------------------------------------------------------------------- */
/*  Combined helper for the common case                                        */
/* -------------------------------------------------------------------------- */

export interface RouteContext {
  endpoint: string;
  scopes: ApiKeyScope[];
}

/**
 * Boilerplate-free wrapper:
 *
 *   export async function POST(req: NextRequest) {
 *     return runFpg(req, { endpoint: "/v1/clients", scopes: ["accounts.create"] },
 *       async ({ ctx, body }) => {
 *         // ... your logic, return signAndSend(...)
 *       });
 *   }
 */
export async function runFpg(
  req: NextRequest,
  route: RouteContext,
  fn: (args: {
    ctx: FpgAuthContext;
    body: unknown;
    rawBody: string;
    finalize: IdempotencyResolution["finalize"];
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticate(req, route.scopes);
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  // For GET methods we still parse the (probably empty) body for consistency
  const idem = await handleIdempotency(req, route.endpoint, ctx);
  if ("error" in idem) return idem.error;
  if ("hit" in idem) return idem.res;

  try {
    const res = await fn({
      ctx,
      body: idem.parsedBody,
      rawBody: idem.rawBody,
      finalize: idem.finalize,
    });
    return res;
  } catch (err) {
    console.error("[fpg route]", err);
    return fpgError(500, "fpg.internal", "Internal error", ctx);
  }
}
