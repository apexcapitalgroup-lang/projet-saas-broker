"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/Icon";
import { useConfirm, useToast } from "@/components/Toast";

/**
 * Header actions on the Withdrawals admin page.
 */
export function WithdrawalsHeaderActions() {
  const { push } = useToast();
  const router = useRouter();
  const [syncing, setSyncing] = React.useState(false);
  function exportRecords() {
    push({
      title: "Export started",
      description: "CSV will download shortly · 3,184 rows.",
    });
    // Trigger a blob download for visual feedback
    const csv = `id,client_apex_id,amount,currency,status,created_at\nwd_01,APX-100483,40000,EUR,under_review,2026-05-25\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "withdrawals-2026-05.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  async function sync() {
    setSyncing(true);
    push({ title: "Pulling fresh withdrawals from FPG…" });
    setTimeout(() => {
      setSyncing(false);
      push({
        title: "Sync complete",
        description: "6 withdrawals updated · 0 conflicts",
        tone: "success",
      });
      router.refresh();
    }, 900);
  }
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary" onClick={exportRecords}>
        <I.Download size={14} />
        Export
      </button>
      <button className="btn-primary" onClick={sync} disabled={syncing}>
        <I.Refresh size={14} />
        {syncing ? "Syncing…" : "Sync with FPG"}
      </button>
    </div>
  );
}

/**
 * Per-row Review / View button on the Withdrawals table.
 */
export function WithdrawalRowAction({
  withdrawalId,
  status,
  clientName,
  amount,
  currency,
}: {
  withdrawalId: string;
  status: string;
  clientName: string;
  amount: number;
  currency: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { ask } = useConfirm();
  const [busy, setBusy] = React.useState(false);

  const isReviewable = ["requested", "under_review"].includes(status);

  async function decision(d: "approve" | "reject" | "processing" | "complete" | "fail") {
    let reason: string | undefined;
    if (d === "reject" || d === "fail") {
      const r = await ask({
        title: d === "reject" ? "Reject withdrawal" : "Mark as failed",
        description: `${clientName} · ${amount.toLocaleString()} ${currency}`,
        confirmLabel: d === "reject" ? "Reject" : "Mark failed",
        tone: "danger",
        inputLabel: "Reason",
        inputPlaceholder:
          d === "reject"
            ? "AML — source of funds documentation required"
            : "Bank reported funds unrecoverable",
        inputRequired: true,
      });
      if (!r.confirmed) return;
      reason = r.value;
    } else {
      const r = await ask({
        title:
          d === "approve"
            ? "Approve withdrawal"
            : d === "processing"
              ? "Mark as processing"
              : "Mark as completed",
        description: `${clientName} · ${amount.toLocaleString()} ${currency}`,
        confirmLabel:
          d === "approve" ? "Approve" : d === "processing" ? "Mark processing" : "Mark completed",
      });
      if (!r.confirmed) return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: d, reason }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? "Server error");
      }
      push({
        title: `Withdrawal ${d}`,
        description: `${withdrawalId} updated. Webhook dispatched.`,
        tone: "success",
      });
      router.refresh();
    } catch (e) {
      push({
        title: "Decision failed",
        description: e instanceof Error ? e.message : String(e),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {isReviewable ? (
        <>
          <button
            className="btn-ghost text-[var(--color-success)]"
            disabled={busy}
            onClick={() => decision("approve")}
          >
            <I.Check size={12} />
            Approve
          </button>
          <button
            className="btn-ghost text-[var(--color-danger)]"
            disabled={busy}
            onClick={() => decision("reject")}
          >
            <I.X size={12} />
            Reject
          </button>
        </>
      ) : status === "approved" ? (
        <button
          className="btn-ghost text-[var(--color-brand)]"
          disabled={busy}
          onClick={() => decision("processing")}
        >
          Process
          <I.ChevronRight size={12} />
        </button>
      ) : status === "processing" ? (
        <button
          className="btn-ghost text-[var(--color-brand)]"
          disabled={busy}
          onClick={() => decision("complete")}
        >
          Complete
          <I.ChevronRight size={12} />
        </button>
      ) : (
        <button
          className="btn-ghost"
          onClick={() =>
            push({
              title: `Viewing ${withdrawalId}`,
              description: `${clientName} · ${amount.toLocaleString()} ${currency}`,
            })
          }
        >
          View
        </button>
      )}
    </div>
  );
}
