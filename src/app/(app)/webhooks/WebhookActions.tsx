"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/Icon";
import { useConfirm, useToast } from "@/components/Toast";

export function WebhookHeaderActions() {
  const { push } = useToast();
  const { ask } = useConfirm();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  function exportLog() {
    push({
      title: "Export started",
      description: "Webhook log being prepared · 1,842 events.",
    });
    const csv = `event_id,type,status,attempts,duration_ms,received_at\nevt_01HXY8K2Q7N,deposit_completed,delivered,1,142,2026-05-25T07:14:32Z\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webhook-events-2026-05.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function forceReplay() {
    const r = await ask({
      title: "Force replay all retries?",
      description:
        "This will re-enqueue the 4 events currently in the retry queue and POST them to the APEX ingress.",
      confirmLabel: "Replay 4 events",
    });
    if (!r.confirmed) return;
    setBusy("replay");
    try {
      await new Promise((r) => setTimeout(r, 700));
      push({
        title: "4 events replayed",
        description: "All retry-state events have been re-dispatched.",
        tone: "success",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondary" onClick={exportLog}>
        <I.Download size={14} />
        Export log
      </button>
      <button
        className="btn-secondary"
        onClick={() =>
          push({
            title: "Endpoint configured",
            description:
              "POST https://api.apex-ops.com/v1/webhooks/fpg · HMAC-SHA256 · idempotency by event_id.",
          })
        }
      >
        <I.Sliders size={14} />
        Endpoints
      </button>
      <button className="btn-primary" onClick={forceReplay} disabled={busy !== null}>
        <I.Refresh size={14} />
        {busy === "replay" ? "Replaying…" : "Force replay"}
      </button>
    </div>
  );
}

export function WebhookRowReplay({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = React.useState(false);
  async function replay() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${eventId}/replay`, { method: "POST" });
      if (!res.ok) throw new Error("Replay failed");
      push({
        title: "Replay scheduled",
        description: `${eventId} will be re-delivered in < 50 ms.`,
        tone: "success",
      });
      router.refresh();
    } catch (e) {
      push({
        title: "Replay failed",
        description: e instanceof Error ? e.message : String(e),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className="btn-ghost" onClick={replay} disabled={busy}>
      {busy ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-brand-2)]/30 border-t-[var(--color-brand-2)]" />
      ) : (
        <I.Refresh size={12} />
      )}
      Replay
    </button>
  );
}
