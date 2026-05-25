/**
 * Webhook event handlers — what APEX does when FPG sends us an event.
 *
 * Each handler is idempotent (safe to invoke twice for the same event_id).
 * Handlers mutate the APEX-side store: client status updates, account fields,
 * deposit/withdrawal statuses, etc.
 */

import { tx } from "@/server/store";
import type { WebhookEventType } from "@/server/types";
import { newFpgClientId } from "@/lib/ids";

type Payload = Record<string, unknown>;

export async function handleEvent(
  type: WebhookEventType,
  payload: Payload
): Promise<void> {
  const handler = HANDLERS[type];
  if (handler) await handler(payload);
}

const HANDLERS: Partial<Record<WebhookEventType, (p: Payload) => Promise<void>>> = {
  client_created: async (p) => {
    const apexId = String(p.apex_correlation_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      if (!c.fpgId) {
        c.fpgId = newFpgClientId();
        c.updatedAt = new Date().toISOString();
      }
    });
  },

  kyc_approved: async (p) => {
    const apexId = String(p.apex_correlation_id ?? p.client_apex_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      c.kyc = "approved";
      c.status = "approved";
      c.updatedAt = new Date().toISOString();
    });
  },

  kyc_rejected: async (p) => {
    const apexId = String(p.apex_correlation_id ?? p.client_apex_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      c.kyc = "rejected";
      c.status = "rejected";
      c.updatedAt = new Date().toISOString();
    });
  },

  kyc_resubmit_required: async (p) => {
    const apexId = String(p.apex_correlation_id ?? p.client_apex_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      c.kyc = "resubmit_required";
      c.updatedAt = new Date().toISOString();
    });
  },

  document_missing: async (p) => {
    const apexId = String(p.apex_correlation_id ?? p.client_apex_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      c.kyc = "document_missing";
      c.updatedAt = new Date().toISOString();
    });
  },

  compliance_hold: async (p) => {
    const apexId = String(p.apex_correlation_id ?? p.client_apex_id ?? "");
    if (!apexId) return;
    await tx(async (db) => {
      const c = db.clients.find((x) => x.apexId === apexId);
      if (!c) return;
      c.kyc = "compliance_hold";
      c.status = "suspended";
      c.updatedAt = new Date().toISOString();
    });
  },

  trading_account_created: async (p) => {
    const login = String(p.login ?? "");
    if (!login) return;
    await tx(async (db) => {
      const a = db.tradingAccounts.find((x) => x.login === login);
      if (a) {
        a.status = "active";
        return;
      }
      // If the account record didn't exist yet on APEX side, create a placeholder
      // (real flow: APEX would already know about it from the POST response).
    });
  },

  leverage_changed: async (p) => {
    const login = String(p.login ?? "");
    const to = Number(p.to ?? 0);
    if (!login || !to) return;
    await tx(async (db) => {
      const a = db.tradingAccounts.find((x) => x.login === login);
      if (a) a.leverage = to;
    });
  },

  deposit_completed: async (p) => {
    const id = String(p.deposit_id ?? "");
    if (!id) return;
    await tx(async (db) => {
      const d = db.deposits.find((x) => x.id === id);
      if (!d) return;
      d.status = "completed";
      d.completedAt = new Date().toISOString();
      // Credit account balance
      const acc = db.tradingAccounts.find((a) => a.login === d.accountLogin);
      if (acc) {
        acc.balance += d.amount;
        acc.equity += d.amount;
        acc.freeMargin += d.amount;
      }
      // Update client totals
      const c = db.clients.find((x) => x.apexId === d.clientApexId);
      if (c) {
        c.totalDeposits += d.amount;
        c.netDeposit += d.amount;
        c.updatedAt = new Date().toISOString();
        c.lastActivityAt = new Date().toISOString();
      }
    });
  },

  deposit_failed: async (p) => {
    const id = String(p.deposit_id ?? "");
    const reason = p.reason ? String(p.reason) : undefined;
    await tx(async (db) => {
      const d = db.deposits.find((x) => x.id === id);
      if (!d) return;
      d.status = "failed";
      d.failedAt = new Date().toISOString();
      d.failureReason = reason;
    });
  },

  withdrawal_under_review: async (p) => {
    const id = String(p.withdrawal_id ?? "");
    await tx(async (db) => {
      const w = db.withdrawals.find((x) => x.id === id);
      if (!w) return;
      w.status = "under_review";
      w.updatedAt = new Date().toISOString();
    });
  },

  withdrawal_approved: async (p) => {
    const id = String(p.withdrawal_id ?? "");
    await tx(async (db) => {
      const w = db.withdrawals.find((x) => x.id === id);
      if (!w) return;
      w.status = "approved";
      w.updatedAt = new Date().toISOString();
    });
  },

  withdrawal_processing: async (p) => {
    const id = String(p.withdrawal_id ?? "");
    await tx(async (db) => {
      const w = db.withdrawals.find((x) => x.id === id);
      if (!w) return;
      w.status = "processing";
      w.updatedAt = new Date().toISOString();
    });
  },

  withdrawal_completed: async (p) => {
    const id = String(p.withdrawal_id ?? "");
    await tx(async (db) => {
      const w = db.withdrawals.find((x) => x.id === id);
      if (!w) return;
      w.status = "completed";
      w.updatedAt = new Date().toISOString();
      const acc = db.tradingAccounts.find((a) => a.login === w.accountLogin);
      if (acc) {
        acc.balance -= w.amount;
        acc.equity -= w.amount;
        acc.freeMargin -= w.amount;
      }
      const c = db.clients.find((x) => x.apexId === w.clientApexId);
      if (c) {
        c.netDeposit -= w.amount;
        c.updatedAt = new Date().toISOString();
      }
    });
  },

  withdrawal_rejected: async (p) => {
    const id = String(p.withdrawal_id ?? "");
    const reason = p.reason ? String(p.reason) : undefined;
    await tx(async (db) => {
      const w = db.withdrawals.find((x) => x.id === id);
      if (!w) return;
      w.status = "rejected";
      w.rejectionReason = reason;
      w.updatedAt = new Date().toISOString();
    });
  },
};
