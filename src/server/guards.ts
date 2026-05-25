/**
 * Common authorization guards for APEX-internal API routes.
 * Returns a structured NextResponse on failure or the resolved session on success.
 */

import { NextResponse } from "next/server";
import {
  AuthError,
  requireAdminSession,
  requireClientSession,
  type CurrentSession,
} from "./auth";
import { jsonError } from "./http";

export async function adminGuard(): Promise<
  { ok: true; session: Extract<CurrentSession, { kind: "admin" }> }
  | { ok: false; res: NextResponse }
> {
  try {
    const cur = await requireAdminSession();
    return { ok: true, session: cur };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, res: jsonError(e.status, e.code, e.message) };
    }
    throw e;
  }
}

export async function clientGuard(): Promise<
  { ok: true; session: Extract<CurrentSession, { kind: "client" }> }
  | { ok: false; res: NextResponse }
> {
  try {
    const cur = await requireClientSession();
    return { ok: true, session: cur };
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, res: jsonError(e.status, e.code, e.message) };
    }
    throw e;
  }
}
