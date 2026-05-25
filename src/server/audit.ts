import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/now";
import { tx } from "./store";
import type { AuditEntry, AuditResult } from "./types";

export interface AuditInput {
  actor: string;
  actorRole: string;
  action: string;
  target?: string;
  ip: string;
  userAgent?: string;
  result: AuditResult;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export async function audit(entry: AuditInput): Promise<AuditEntry> {
  const e: AuditEntry = {
    id: newId("log"),
    at: nowIso(),
    ...entry,
  };
  await tx(async (db) => {
    db.auditLog.unshift(e); // newest first
    if (db.auditLog.length > 5000) db.auditLog.length = 5000;
  });
  return e;
}
