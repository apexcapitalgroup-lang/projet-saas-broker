import { nowIso } from "@/lib/now";
import { sha256 } from "@/server/crypto";
import { tx, findIdempotency } from "@/server/store";

const TTL_MS = 24 * 60 * 60_000;

export interface IdempotencyHit {
  hit: true;
  body: unknown;
  status: number;
  headers: Record<string, string>;
}

export interface IdempotencyMiss {
  hit: false;
  /** Record the response now so future calls with the same key return it. */
  record(body: unknown, status: number, headers?: Record<string, string>): Promise<void>;
}

export interface IdempotencyConflict {
  conflict: true;
  reason: "body_mismatch" | "endpoint_mismatch";
}

/**
 * Look up an Idempotency-Key. Three outcomes:
 *  - HIT     → return cached response
 *  - MISS    → caller proceeds, records the response when done
 *  - CONFLICT→ key reused with different body or endpoint
 */
export async function lookupIdempotency(
  key: string,
  endpoint: string,
  bodyHash: string
): Promise<IdempotencyHit | IdempotencyMiss | IdempotencyConflict> {
  const existing = await findIdempotency(key);
  if (existing) {
    if (existing.endpoint !== endpoint) {
      return { conflict: true, reason: "endpoint_mismatch" };
    }
    if (existing.bodyHash !== bodyHash) {
      return { conflict: true, reason: "body_mismatch" };
    }
    return {
      hit: true,
      body: existing.responseBody,
      status: existing.responseStatus,
      headers: existing.responseHeaders,
    };
  }
  return {
    hit: false,
    async record(body, status, headers = {}) {
      await tx(async (db) => {
        db.idempotency.push({
          key,
          bodyHash,
          responseBody: body,
          responseStatus: status,
          responseHeaders: headers,
          createdAt: nowIso(),
          expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
          endpoint,
        });
        // Cap the table size
        if (db.idempotency.length > 1000) db.idempotency.shift();
      });
    },
  };
}

export function hashBody(raw: string): string {
  return sha256(raw);
}
