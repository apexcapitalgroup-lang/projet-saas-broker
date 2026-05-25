"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/Icon";

interface Props {
  depositId: string;
  status: string;
  clientApexId: string;
}

export function PspActions({ depositId, status, clientApexId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"success" | "fail" | null>(null);
  const [done, setDone] = React.useState<null | "success" | "fail">(
    status === "completed" ? "success" : status === "failed" ? "fail" : null
  );

  async function send(outcome: "success" | "fail") {
    setBusy(outcome);
    try {
      const res = await fetch(`/api/fpg/v1/internal/psp-callback/${depositId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (res.ok) {
        setDone(outcome);
        // Wait so the user sees the success state, then redirect back to the portal
        setTimeout(() => {
          router.push(`/portal?deposit=${depositId}&status=${outcome}`);
        }, 1500);
      }
    } finally {
      setBusy(null);
    }
  }

  if (done === "success") {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-md border border-[var(--color-success-soft)] bg-[var(--color-success-soft)] px-3 py-3 text-[var(--color-success)]">
        <I.CircleCheck size={16} />
        <div className="flex flex-col">
          <span className="text-[12.5px] font-semibold">Payment authorised</span>
          <span className="text-[11px]">Redirecting you back to APEX…</span>
        </div>
      </div>
    );
  }
  if (done === "fail") {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-md border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-3 py-3 text-[var(--color-danger)]">
        <I.CircleX size={16} />
        <div className="flex flex-col">
          <span className="text-[12.5px] font-semibold">Payment declined</span>
          <span className="text-[11px]">Redirecting you back to APEX…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      <button
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--color-ink)] px-4 text-[13.5px] font-semibold text-white hover:bg-[var(--color-ink-2)] disabled:opacity-60"
        onClick={() => send("success")}
        disabled={busy !== null}
      >
        {busy === "success" ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <I.Lock size={14} />
        )}
        Pay securely
      </button>
      <button
        className="flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-4 text-[12.5px] text-[var(--color-ink-3)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-60"
        onClick={() => send("fail")}
        disabled={busy !== null}
      >
        Simulate failure
      </button>
      <p className="text-center text-[10px] text-[var(--color-ink-4)]">
        Demo controls — both buttons trigger a server-to-server callback to FPG.
      </p>
    </div>
  );
}
