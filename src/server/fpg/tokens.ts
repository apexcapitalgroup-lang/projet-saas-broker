import { newId } from "@/lib/ids";
import { tx, getDb } from "@/server/store";
import type { ApiKeyScope, FpgToken } from "@/server/types";

const TOKEN_TTL_MS = 24 * 60 * 60_000; // 24 hours

export async function issueToken(
  clientId: string,
  scopes: ApiKeyScope[],
  ip?: string
): Promise<FpgToken> {
  const accessToken = `fpg_${newId("tok").slice(4)}`;
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const token: FpgToken = {
    accessToken,
    clientId,
    scopes,
    issuedAt,
    expiresAt,
    ip,
  };
  await tx(async (db) => {
    db.fpgTokens.unshift(token);
    if (db.fpgTokens.length > 200) db.fpgTokens.length = 200;
  });
  return token;
}

export async function verifyToken(
  accessToken: string
): Promise<{ valid: true; token: FpgToken } | { valid: false; reason: "missing" | "invalid" | "expired" }> {
  if (!accessToken) return { valid: false, reason: "missing" };
  const db = await getDb();
  const token = db.fpgTokens.find((t) => t.accessToken === accessToken);
  if (!token) return { valid: false, reason: "invalid" };
  if (new Date(token.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true, token };
}
