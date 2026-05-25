"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { I } from "./Icon";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "./Dropdown";
import { useToast } from "./Toast";

export function PortalTopbar() {
  const router = useRouter();
  const { push } = useToast();

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

        <Dropdown
          align="right"
          trigger={(p) => (
            <button
              {...p}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
              title="Notifications"
            >
              <I.Bell size={16} />
              <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-[var(--color-brand-2)]" />
            </button>
          )}
        >
          {(close) => (
            <div className="w-[300px] -mx-1 -my-1">
              <DropdownLabel>Inbox</DropdownLabel>
              {[
                ["info", "KYC annual review due 2027-04-12", "Today"],
                ["warning", "Withdrawal under review", "40,000 EUR · 2h ago"],
                ["success", "Deposit completed", "$25,000 · Yesterday"],
              ].map(([tone, title, ts], i) => (
                <button
                  key={i}
                  onClick={() => {
                    close();
                    push({ title: `Opened: ${title}` });
                  }}
                  className="flex w-full items-start gap-2 rounded px-2 py-2 text-left hover:bg-[var(--color-bg-muted)]"
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      tone === "warning"
                        ? "bg-[var(--color-warning)]"
                        : tone === "success"
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--color-info)]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[var(--color-ink)]">{title}</div>
                    <div className="text-[10.5px] text-[var(--color-ink-4)]">{ts}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <Dropdown
          align="right"
          trigger={(p) => (
            <button
              {...p}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
              title="Help"
            >
              <I.Info size={16} />
            </button>
          )}
        >
          {(close) => (
            <div className="w-[260px] -mx-1 -my-1">
              <DropdownLabel>Need help?</DropdownLabel>
              <DropdownItem
                onClick={() => {
                  close();
                  push({
                    title: "Message sent",
                    description: "Your account manager will reply within 1 business hour.",
                    tone: "success",
                  });
                }}
                icon={<I.Mail size={13} />}
              >
                Contact account manager
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  router.push("/portal/documents");
                }}
                icon={<I.Document size={13} />}
              >
                Documents & statements
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  router.push("/portal/profile");
                }}
                icon={<I.Shield size={13} />}
              >
                Profile & security
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
