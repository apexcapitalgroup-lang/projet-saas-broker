import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { newCorrelationId } from "@/lib/ids";

/* -------------------------------------------------------------------------- */
/*  Standard response envelope                                                 */
/* -------------------------------------------------------------------------- */

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ErrorBody {
  error: ApiError;
  request_id: string;
}

export function jsonOk<T>(
  body: T,
  init: { status?: number; headers?: Record<string, string> } = {}
): NextResponse {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  opts: {
    field?: string;
    details?: unknown;
    requestId?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const body: ErrorBody = {
    error: { code, message, field: opts.field, details: opts.details },
    request_id: opts.requestId ?? newCorrelationId("req"),
  };
  return NextResponse.json(body, { status, headers: opts.headers });
}

/* -------------------------------------------------------------------------- */
/*  Request parsing                                                            */
/* -------------------------------------------------------------------------- */

export async function readJson<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      error: jsonError(400, "request.invalid_json", "Body must be valid JSON"),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      error: jsonError(422, "request.schema_validation", "Body validation failed", {
        details: result.error.issues,
      }),
    };
  }
  return { data: result.data };
}

export function readQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      error: jsonError(422, "query.schema_validation", "Query validation failed", {
        details: result.error.issues,
      }),
    };
  }
  return { data: result.data };
}

/* -------------------------------------------------------------------------- */
/*  Request context (IP, UA)                                                   */
/* -------------------------------------------------------------------------- */

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") ?? "—";
}

/* -------------------------------------------------------------------------- */
/*  Error boundary for route handlers                                          */
/* -------------------------------------------------------------------------- */

export async function withErrorHandling<T extends NextResponse>(
  fn: () => Promise<T>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return jsonError(422, "schema.validation", "Validation failed", {
        details: err.issues,
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api error]", message, err);
    return jsonError(500, "server.unknown", "Internal server error");
  }
}
