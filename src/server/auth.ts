import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { signSessionToken, verifySessionToken } from "./crypto";
import { getDb, findSession, tx } from "./store";
import type { Session, SessionKind, Client, TeamMember } from "./types";

const SESSION_COOKIE = "apex_session";
const SESSION_TTL_MS = 45 * 60_000; // 45 minutes sliding
const SESSION_SECRET =
  process.env.APEX_SESSION_SECRET ??
  "dev-session-secret-apex-powered-by-fpg-CHANGE-IN-PRODUCTION";

/* -------------------------------------------------------------------------- */
/*  Session creation                                                           */
/* -------------------------------------------------------------------------- */

export interface NewSessionInput {
  kind: SessionKind;
  refId: string;
  twoFactorVerified?: boolean;
  ip: string;
  userAgent: string;
}

export async function createSession(input: NewSessionInput): Promise<Session> {
  const id = newId("sess");
  // Sessions are real-time things (cookie expiry, replay protection),
  // so use Date.now() — NOT the frozen demo NOW.
  const issuedAt = Date.now();
  const session: Session = {
    id,
    kind: input.kind,
    refId: input.refId,
    twoFactorVerified: input.twoFactorVerified ?? false,
    createdAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(issuedAt + SESSION_TTL_MS).toISOString(),
    lastActivityAt: new Date(issuedAt).toISOString(),
    ip: input.ip,
    userAgent: input.userAgent,
  };
  await tx(async (db) => {
    db.sessions.unshift(session);
    if (db.sessions.length > 1000) db.sessions.length = 1000;
  });
  return session;
}

export async function elevateToTwoFactor(sessionId: string): Promise<Session | null> {
  let updated: Session | null = null;
  await tx(async (db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.twoFactorVerified = true;
    s.lastActivityAt = nowIso();
    updated = s;
  });
  return updated;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await tx(async (db) => {
    db.sessions = db.sessions.filter((s) => s.id !== sessionId);
  });
}

export async function extendSession(sessionId: string): Promise<void> {
  await tx(async (db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    if (!s) return;
    s.lastActivityAt = nowIso();
    s.expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  });
}

/* -------------------------------------------------------------------------- */
/*  Cookie helpers                                                             */
/* -------------------------------------------------------------------------- */

function tokenFor(session: Session): string {
  return signSessionToken(
    session.id,
    new Date(session.expiresAt).getTime(),
    SESSION_SECRET
  );
}

export async function writeSessionCookie(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, tokenFor(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/* -------------------------------------------------------------------------- */
/*  Reading the current session                                                */
/* -------------------------------------------------------------------------- */

export type CurrentSession =
  | { kind: "admin"; session: Session; user: TeamMember }
  | { kind: "client"; session: Session; user: Client }
  | null;

async function resolveSession(token: string | undefined): Promise<CurrentSession> {
  if (!token) return null;
  const parsed = verifySessionToken(token, SESSION_SECRET);
  if (!parsed) return null;
  if (parsed.expiresAt < Date.now()) return null;
  const session = await findSession(parsed.sessionId);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const db = await getDb();
  if (session.kind === "admin") {
    const user = db.teamMembers.find((m) => m.id === session.refId);
    if (!user) return null;
    return { kind: "admin", session, user };
  }
  const user = db.clients.find((c) => c.id === session.refId);
  if (!user) return null;
  return { kind: "client", session, user };
}

/** From a Server Component / route handler with App Router cookies(). */
export async function getCurrentSession(): Promise<CurrentSession> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return resolveSession(token);
}

/** From a NextRequest in middleware or a route handler that has the request. */
export async function getCurrentSessionFromRequest(
  req: NextRequest
): Promise<CurrentSession> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return resolveSession(token);
}

/* -------------------------------------------------------------------------- */
/*  Guards                                                                     */
/* -------------------------------------------------------------------------- */

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export async function requireAdminSession() {
  const cur = await getCurrentSession();
  if (!cur || cur.kind !== "admin") {
    throw new AuthError(401, "auth.required", "Admin session required");
  }
  if (!cur.session.twoFactorVerified) {
    throw new AuthError(403, "auth.two_factor_required", "Two-factor verification required");
  }
  return cur;
}

export async function requireClientSession() {
  const cur = await getCurrentSession();
  if (!cur || cur.kind !== "client") {
    throw new AuthError(401, "auth.required", "Client session required");
  }
  return cur;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
