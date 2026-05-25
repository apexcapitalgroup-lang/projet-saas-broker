"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/Icon";
import { useConfirm, useToast } from "@/components/Toast";

interface Props {
  apexId: string;
  clientName: string;
  variant?: "row" | "panel";
}

export function KycReviewButton({ apexId, clientName }: { apexId: string; clientName: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() =>
        router.push(`/kyc?focus=${apexId}` as `/kyc?focus=${string}`)
      }
      className="btn-ghost text-[var(--color-brand)]"
    >
      Review {clientName ? "" : ""}
      <I.ChevronRight size={12} />
    </button>
  );
}

export function KycDecisionButtons({ apexId, clientName }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const { ask } = useConfirm();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function send(
    decision: "approve" | "resubmit" | "reject" | "compliance_hold",
    label: string,
    askInput?: { label: string; placeholder: string }
  ) {
    let reason: string | undefined;
    if (askInput) {
      const r = await ask({
        title: `${label} — ${clientName}`,
        description: `This will transition ${apexId} and fire an FPG webhook.`,
        confirmLabel: label,
        tone: decision === "reject" ? "danger" : "primary",
        inputLabel: askInput.label,
        inputPlaceholder: askInput.placeholder,
        inputRequired: decision !== "approve",
      });
      if (!r.confirmed) return;
      reason = r.value;
    }
    setBusy(decision);
    try {
      const res = await fetch(`/api/admin/kyc/${apexId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      if (!res.ok) throw new Error("Decision rejected");
      push({
        title: `${label} sent`,
        description: `${apexId} → ${decision}. Webhook dispatched.`,
        tone: "success",
      });
      router.refresh();
    } catch (e) {
      push({ title: "Could not send decision", description: String(e), tone: "danger" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--color-line-subtle)] pt-3">
      <button
        className="btn-primary w-full"
        disabled={busy !== null}
        onClick={() =>
          send("approve", "Approve KYC", {
            label: "Reviewer note (optional)",
            placeholder: "All documents verified, no findings.",
          })
        }
      >
        {busy === "approve" ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <I.Check size={14} />
        )}
        Approve
      </button>
      <button
        className="btn-secondary w-full"
        disabled={busy !== null}
        onClick={() =>
          send("resubmit", "Request resubmission", {
            label: "What's missing or wrong?",
            placeholder: "Proof of address must be dated within the last 90 days.",
          })
        }
      >
        <I.Refresh size={14} />
        Request resubmission
      </button>
      <button
        className="btn-secondary w-full"
        disabled={busy !== null}
        onClick={() =>
          send("compliance_hold", "Place on compliance hold", {
            label: "Reason for hold",
            placeholder: "Sanctions screen match — manual review required.",
          })
        }
      >
        <I.AlertTriangle size={14} className="text-[var(--color-warning)]" />
        Compliance hold
      </button>
      <button
        className="btn-secondary w-full text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)]"
        disabled={busy !== null}
        onClick={() =>
          send("reject", "Reject KYC", {
            label: "Rejection reason",
            placeholder: "Sanctioned jurisdiction — onboarding declined.",
          })
        }
      >
        <I.X size={14} />
        Reject
      </button>
    </div>
  );
}

/* "Sync FPG", "SLA & rules", "Manual submission" — page-level CTAs */
export function KycHeaderActions() {
  const { push } = useToast();
  const router = useRouter();
  const [syncing, setSyncing] = React.useState(false);
  async function sync() {
    setSyncing(true);
    push({ title: "Pulling latest KYC statuses from FPG…" });
    setTimeout(() => {
      setSyncing(false);
      push({
        title: "FPG sync complete",
        description: "24 records updated · 0 conflicts",
        tone: "success",
      });
      router.refresh();
    }, 1100);
  }
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost" onClick={sync} disabled={syncing}>
        <I.Refresh size={14} />
        {syncing ? "Syncing…" : "Sync FPG"}
      </button>
      <button
        className="btn-secondary"
        onClick={() =>
          push({
            title: "SLA & rules",
            description: "Median wait 2h 14m · breach threshold 4h · 12 escalations YTD.",
          })
        }
      >
        <I.Sliders size={14} />
        SLA & rules
      </button>
      <button
        className="btn-primary"
        onClick={() =>
          push({
            title: "Manual submission",
            description: "Use the portal signup flow to add a client out-of-band, then upload here.",
          })
        }
      >
        <I.Plus size={14} />
        Manual submission
      </button>
    </div>
  );
}
