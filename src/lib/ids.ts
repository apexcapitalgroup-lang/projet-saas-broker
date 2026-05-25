import { randomBytes } from "node:crypto";

// Crockford base32 alphabet (omits I, L, O, U for unambiguity)
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomBase32(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] & 31];
  return out;
}

let APX_COUNTER = 100_000;
let FPG_COUNTER = 7_740_000;

export function newApexId(): string {
  APX_COUNTER += 1;
  return `APX-${APX_COUNTER}`;
}

export function newFpgClientId(): string {
  FPG_COUNTER += 1;
  return `FPG-${FPG_COUNTER}`;
}

/** Stripe-like event id with random suffix */
export function newEventId(): string {
  return `evt_01${randomBase32(24)}`;
}

/** Correlation id for a single request lifecycle */
export function newCorrelationId(prefix = "apex"): string {
  return `${prefix}-${randomBase32(12).toLowerCase()}`;
}

/** Generic resource id with a typed prefix */
export function newId(prefix: string): string {
  return `${prefix}_${randomBase32(16)}`;
}

/** Set the counters from existing seed so generated IDs don't collide */
export function bumpCountersFromSeed(maxApx: number, maxFpg: number) {
  if (maxApx > APX_COUNTER) APX_COUNTER = maxApx;
  if (maxFpg > FPG_COUNTER) FPG_COUNTER = maxFpg;
}
