import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/* -------------------------------------------------------------------------- */
/*  Password hashing (scrypt — built into Node, no install)                    */
/* -------------------------------------------------------------------------- */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const actual = Buffer.from(hash, "hex");
  if (candidate.length !== actual.length) return false;
  return timingSafeEqual(candidate, actual);
}

/* -------------------------------------------------------------------------- */
/*  HMAC signing for FPG webhooks & responses                                  */
/* -------------------------------------------------------------------------- */

/**
 * Stripe-style signature:
 *    X-FPG-Signature: t=<unix-seconds>, v1=<hex>
 *    v1 = HMAC_SHA256(secret, `${t}.${eventId}.${rawBody}`)
 *
 * Tolerance for replay protection: 5 minutes by default.
 */

export interface WebhookSignatureHeader {
  t: number;
  v1: string;
}

export function buildSignaturePayload(
  timestampSec: number,
  eventOrRequestId: string,
  rawBody: string
): string {
  return `${timestampSec}.${eventOrRequestId}.${rawBody}`;
}

export function signWebhook(
  timestampSec: number,
  eventOrRequestId: string,
  rawBody: string,
  secret: string
): string {
  const payload = buildSignaturePayload(timestampSec, eventOrRequestId, rawBody);
  const v1 = createHmac("sha256", secret).update(payload).digest("hex");
  return `t=${timestampSec}, v1=${v1}`;
}

export function parseSignatureHeader(
  header: string
): WebhookSignatureHeader | null {
  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!t || !v1) return null;
  const tNum = Number(t);
  if (!Number.isFinite(tNum)) return null;
  return { t: tNum, v1 };
}

export function verifyWebhookSignature(
  header: string,
  eventOrRequestId: string,
  rawBody: string,
  secret: string,
  toleranceSec = 300
): { ok: true } | { ok: false; reason: "malformed" | "expired" | "mismatch" } {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: "malformed" };
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parsed.t) > toleranceSec) {
    return { ok: false, reason: "expired" };
  }
  const expected = createHmac("sha256", secret)
    .update(buildSignaturePayload(parsed.t, eventOrRequestId, rawBody))
    .digest("hex");
  const actual = Buffer.from(parsed.v1, "hex");
  const exp = Buffer.from(expected, "hex");
  if (actual.length !== exp.length) return { ok: false, reason: "mismatch" };
  if (!timingSafeEqual(actual, exp)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  Body hashing for idempotency                                               */
/* -------------------------------------------------------------------------- */

export function sha256(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function shortSha(input: string | Buffer): string {
  return sha256(input).slice(0, 12);
}

/* -------------------------------------------------------------------------- */
/*  Session token signing (HMAC of session_id|expiresAt)                       */
/* -------------------------------------------------------------------------- */

export function signSessionToken(
  sessionId: string,
  expiresAt: number,
  secret: string
): string {
  const payload = `${sessionId}.${expiresAt}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${sessionId}.${expiresAt}.${sig}`;
}

export function verifySessionToken(
  token: string,
  secret: string
): { sessionId: string; expiresAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresAtRaw, sig] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return null;
  const expected = createHmac("sha256", secret)
    .update(`${sessionId}.${expiresAt}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { sessionId, expiresAt };
}

/* -------------------------------------------------------------------------- */
/*  TOTP (RFC 6238) — pure Node crypto, no library                             */
/* -------------------------------------------------------------------------- */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(length = 20): string {
  const bytes = randomBytes(length);
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Compute a 6-digit TOTP code for the given secret at the given Unix time.
 * Step = 30s, digits = 6. Compatible with Google Authenticator / 1Password.
 */
export function computeTotp(
  secretBase32: string,
  timeSec: number = Math.floor(Date.now() / 1000)
): string {
  const counter = Math.floor(timeSec / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const key = base32Decode(secretBase32);
  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = (binary % 1_000_000).toString().padStart(6, "0");
  return code;
}

/**
 * Validate a TOTP code, allowing ±1 30-second window for clock skew.
 * Returns true if the code matches in any of the three windows.
 *
 * Demo-friendly: also accepts the fixed code `123456` (documented in README).
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  opts: { acceptDemoCode?: boolean; tolerance?: number } = {}
): boolean {
  const cleaned = code.replace(/\s/g, "");
  if (opts.acceptDemoCode !== false && cleaned === "123456") return true;
  if (!/^\d{6}$/.test(cleaned)) return false;
  const tolerance = opts.tolerance ?? 1;
  const now = Math.floor(Date.now() / 1000);
  for (let dt = -tolerance; dt <= tolerance; dt++) {
    if (computeTotp(secretBase32, now + dt * 30) === cleaned) return true;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Constant-time string compare                                               */
/* -------------------------------------------------------------------------- */

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return timingSafeEqual(ba, bb);
}
