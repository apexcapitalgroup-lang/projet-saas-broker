"use client";

import * as React from "react";
import Link from "next/link";
import { I } from "./Icon";

export function PortalTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 px-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          Markets open
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-3)]">
          <I.Globe size={12} />
          London 09:00 · New York 04:00 · Tokyo 18:00
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          href="/portal/deposit"
          className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-success)] px-3 text-[12px] font-semibold text-white hover:brightness-95"
        >
          <I.ArrowDownLeft size={14} />
          Deposit
        </Link>
        <Link
          href="/portal/withdraw"
          className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-white px-3 text-[12px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-brand-tint)]"
        >
          <I.ArrowUpRight size={14} />
          Withdraw
        </Link>

        <div className="mx-2 hidden md:block h-6 w-px bg-[var(--color-line)]" />

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
          title="Notifications"
        >
          <I.Bell size={16} />
          <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-[var(--color-brand-2)]" />
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
          title="Help"
        >
          <I.Info size={16} />
        </button>
      </div>
    </header>
  );
}
