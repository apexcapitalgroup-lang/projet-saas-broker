/**
 * Singleton in-memory store with disk persistence.
 *
 * - Survives Next.js dev HMR via globalThis attachment.
 * - All writes go through `db.tx(fn)` (mutex + debounced disk flush).
 * - Reads are direct array access — fast, no copies.
 */

import type { DatabaseShape } from "./types";
import { buildSeed } from "./seed";
import { loadDb, scheduleWrite, writeNow } from "./persist";

const GLOBAL_KEY = "__APEX_DB__";

interface GlobalShape {
  db?: DatabaseShape;
  initPromise?: Promise<DatabaseShape>;
  mutex?: Promise<void>;
}

const g = globalThis as unknown as Record<string, unknown>;
if (!(GLOBAL_KEY in g)) {
  (g as Record<string, GlobalShape>)[GLOBAL_KEY] = {};
}
const slot = (g as Record<string, GlobalShape>)[GLOBAL_KEY];

/* -------------------------------------------------------------------------- */
/*  Initialisation                                                             */
/* -------------------------------------------------------------------------- */

async function initDb(): Promise<DatabaseShape> {
  const fromDisk = await loadDb();
  if (fromDisk) return fromDisk;
  const seeded = buildSeed();
  scheduleWrite(seeded);
  return seeded;
}

function ensureInit(): Promise<DatabaseShape> {
  if (slot.db) return Promise.resolve(slot.db);
  if (!slot.initPromise) {
    slot.initPromise = initDb().then((db) => {
      slot.db = db;
      return db;
    });
  }
  return slot.initPromise;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Get the database for a read. Awaits initial seed if first call.
 * Returned reference is the live store — do not mutate outside a tx().
 */
export async function getDb(): Promise<DatabaseShape> {
  return ensureInit();
}

/**
 * Run a function inside a serialised transaction. Mutations are flushed
 * to disk after a debounced window.
 */
export async function tx<T>(fn: (db: DatabaseShape) => T | Promise<T>): Promise<T> {
  const db = await ensureInit();
  // serialise concurrent mutations
  const prev = slot.mutex ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((res) => {
    release = res;
  });
  slot.mutex = prev.then(() => next);
  try {
    await prev;
    const result = await fn(db);
    scheduleWrite(db);
    return result;
  } finally {
    release();
  }
}

/**
 * Force-flush to disk (used on graceful shutdown).
 */
export async function flush(): Promise<void> {
  if (!slot.db) return;
  await writeNow(slot.db);
}

/**
 * Reset the database to a fresh seed. Used by tests and `npm run db:reset`.
 */
export async function resetDb(): Promise<void> {
  const seeded = buildSeed();
  slot.db = seeded;
  await writeNow(seeded);
}

/* -------------------------------------------------------------------------- */
/*  Indexed lookups (fast)                                                     */
/* -------------------------------------------------------------------------- */

export async function findClientByApex(apexId: string) {
  const db = await getDb();
  return db.clients.find((c) => c.apexId === apexId) ?? null;
}

export async function findClientByFpg(fpgId: string) {
  const db = await getDb();
  return db.clients.find((c) => c.fpgId === fpgId) ?? null;
}

export async function findClientByEmail(email: string) {
  const db = await getDb();
  const lower = email.toLowerCase();
  return db.clients.find((c) => c.email.toLowerCase() === lower) ?? null;
}

export async function findTeamMemberByEmail(email: string) {
  const db = await getDb();
  const lower = email.toLowerCase();
  return db.teamMembers.find((m) => m.email.toLowerCase() === lower) ?? null;
}

export async function findSession(id: string) {
  const db = await getDb();
  return db.sessions.find((s) => s.id === id) ?? null;
}

export async function findAccountByLogin(login: string) {
  const db = await getDb();
  return db.tradingAccounts.find((a) => a.login === login) ?? null;
}

export async function findDeposit(id: string) {
  const db = await getDb();
  return db.deposits.find((d) => d.id === id) ?? null;
}

export async function findWithdrawal(id: string) {
  const db = await getDb();
  return db.withdrawals.find((w) => w.id === id) ?? null;
}

export async function findWebhookByEventId(eventId: string) {
  const db = await getDb();
  return db.webhookEvents.find((w) => w.eventId === eventId) ?? null;
}

export async function findIdempotency(key: string) {
  const db = await getDb();
  return db.idempotency.find((i) => i.key === key) ?? null;
}

export async function findApiKeyByHash(hash: string) {
  const db = await getDb();
  return db.apiKeys.find((k) => k.hashedKey === hash) ?? null;
}
