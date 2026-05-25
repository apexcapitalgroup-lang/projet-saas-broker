import { promises as fs } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DatabaseShape } from "./types";

const DB_PATH = resolve(process.cwd(), "data", "db.json");
const PERSIST_ENABLED =
  (process.env.PERSIST ?? "true").toLowerCase() !== "false";

let writeTimer: NodeJS.Timeout | null = null;
const WRITE_DELAY_MS = 250;

export async function loadDb(): Promise<DatabaseShape | null> {
  if (!PERSIST_ENABLED) return null;
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as DatabaseShape;
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return null;
    // corrupt file or permission error — log and reseed
    console.error("[persist] failed to read db:", e.message);
    return null;
  }
}

export function scheduleWrite(db: DatabaseShape) {
  if (!PERSIST_ENABLED) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    void writeNow(db);
  }, WRITE_DELAY_MS);
}

export async function writeNow(db: DatabaseShape): Promise<void> {
  if (!PERSIST_ENABLED) return;
  try {
    await fs.mkdir(dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DB_PATH);
  } catch (err) {
    console.error("[persist] failed to write db:", err);
  }
}

export function isPersistEnabled(): boolean {
  return PERSIST_ENABLED;
}
