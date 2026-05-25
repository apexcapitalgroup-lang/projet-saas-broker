"use client";

import * as React from "react";
import Link from "next/link";
import { I } from "./Icon";
import { Avatar } from "./ui";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 px-5 backdrop-blur-md">
      {/* environment badge */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-2)]" />
        Production
      </span>

      {/* search */}
      <div className="hidden md:flex flex-1 max-w-[480px] items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-[12.5px] text-[var(--color-ink-4)] hover:border-[var(--color-line-strong)]">
        <I.Search size={14} />
        <span className="flex-1">Search clients, accounts, transactions…</span>
        <span className="kbd">⌘</span>
        <span className="kbd">K</span>
      </div>

      <div className="flex-1 md:hidden" />

      {/* actions */}
      <div className="flex items-center gap-1.5">
        <button
          className="flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-white px-2.5 text-[12px] font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-tint)]"
          title="System health"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span>FPG live</span>
          <span className="text-[var(--color-ink-4)]">·</span>
          <span className="mono text-[var(--color-ink-3)]">82ms</span>
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
          title="Notifications"
        >
          <I.Bell size={16} />
          <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
        </button>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
          title="Help"
        >
          <I.Info size={16} />
        </button>

        <div className="mx-1 h-6 w-px bg-[var(--color-line)]" />

        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2.5 hover:bg-[var(--color-bg-muted)]"
        >
          <Avatar name="Ariane Martin" size={28} />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-[12.5px] font-semibold text-[var(--color-ink)]">Ariane Martin</span>
            <span className="text-[10.5px] text-[var(--color-ink-4)]">Admin · 2FA on</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
