"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "./Icon";
import { Avatar } from "./ui";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "./Dropdown";
import { useToast } from "./Toast";

export function Topbar() {
  const router = useRouter();
  const { push } = useToast();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      push({ title: "Signed out", description: "Session revoked.", tone: "success" });
      setTimeout(() => router.push("/login"), 400);
    } catch {
      push({ title: "Could not sign out", tone: "danger" });
    }
  }

  function refreshHealth() {
    push({
      title: "FPG health refreshed",
      description: "All systems operational · p95 211 ms · 0 errors",
      tone: "success",
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 px-5 backdrop-blur-md">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-soft)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-brand)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-2)]" />
        Production
      </span>

      <button
        type="button"
        onClick={() =>
          push({
            title: "Search · ⌘K",
            description:
              "Quick search is wired up in the dev build. Use the sidebar to navigate.",
          })
        }
        className="hidden md:flex flex-1 max-w-[480px] items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-[12.5px] text-[var(--color-ink-4)] hover:border-[var(--color-line-strong)]"
      >
        <I.Search size={14} />
        <span className="flex-1 text-left">Search clients, accounts, transactions…</span>
        <span className="kbd">⌘</span>
        <span className="kbd">K</span>
      </button>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={refreshHealth}
          className="flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-white px-2.5 text-[12px] font-medium text-[var(--color-ink-2)] hover:bg-[var(--color-brand-tint)]"
          title="Click to refresh"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span>FPG live</span>
          <span className="text-[var(--color-ink-4)]">·</span>
          <span className="mono text-[var(--color-ink-3)]">82ms</span>
        </button>

        <Dropdown
          align="right"
          trigger={(p) => (
            <button
              {...p}
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
              title="Notifications"
            >
              <I.Bell size={16} />
              <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            </button>
          )}
        >
          {(close) => (
            <div className="w-[320px] -mx-1 -my-1">
              <DropdownLabel>Notifications · 4 new</DropdownLabel>
              <div className="flex flex-col">
                {[
                  ["danger", "Reconciliation delta", "20 May · −$5,620 on withdrawals", "1h ago"],
                  ["warning", "Withdrawal needs approval", "Northwind Capital · $380,000", "2h ago"],
                  ["warning", "Webhook retry in progress", "evt_01HXY8K4F02 · attempt 3/6", "3h ago"],
                  ["info", "Monthly statement ready", "April 2026 · APEX-IB-01", "yesterday"],
                ].map(([tone, title, sub, ts], i) => (
                  <button
                    key={i}
                    onClick={() => {
                      close();
                      push({ title: `Opened: ${title}`, description: sub as string });
                    }}
                    className="flex items-start gap-2 rounded px-2 py-2 text-left hover:bg-[var(--color-bg-muted)]"
                  >
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        tone === "danger"
                          ? "bg-[var(--color-danger)]"
                          : tone === "warning"
                            ? "bg-[var(--color-warning)]"
                            : "bg-[var(--color-info)]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[var(--color-ink)]">{title}</div>
                      <div className="text-[10.5px] text-[var(--color-ink-4)]">{sub}</div>
                    </div>
                    <span className="text-[10px] text-[var(--color-ink-4)]">{ts}</span>
                  </button>
                ))}
              </div>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close();
                  push({ title: "All notifications marked as read", tone: "success" });
                }}
              >
                Mark all as read
              </DropdownItem>
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
            <div className="w-[280px] -mx-1 -my-1">
              <DropdownLabel>Help</DropdownLabel>
              <DropdownItem
                onClick={() => {
                  close();
                  window.open(
                    "https://github.com/apexcapitalgroup-lang/projet-saas-broker/blob/master/docs/fpg-api-spec-EN.md",
                    "_blank"
                  );
                }}
              >
                FPG API specification
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  window.open(
                    "https://github.com/apexcapitalgroup-lang/projet-saas-broker/blob/master/docs/security-EN.md",
                    "_blank"
                  );
                }}
              >
                Security model
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  window.open(
                    "https://github.com/apexcapitalgroup-lang/projet-saas-broker/blob/master/docs/operational-runbook.md",
                    "_blank"
                  );
                }}
              >
                Operational runbook
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close();
                  push({
                    title: "Support requested",
                    description: "Our team will reply within 1 business hour.",
                    tone: "success",
                  });
                }}
              >
                Contact support
              </DropdownItem>
            </div>
          )}
        </Dropdown>

        <div className="mx-1 h-6 w-px bg-[var(--color-line)]" />

        <Dropdown
          align="right"
          trigger={(p) => (
            <button
              {...p}
              className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2.5 hover:bg-[var(--color-bg-muted)]"
            >
              <Avatar name="Ariane Martin" size={28} />
              <span className="hidden sm:flex flex-col leading-tight items-start">
                <span className="text-[12.5px] font-semibold text-[var(--color-ink)]">
                  Ariane Martin
                </span>
                <span className="text-[10.5px] text-[var(--color-ink-4)]">Admin · 2FA on</span>
              </span>
              <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
            </button>
          )}
        >
          {(close) => (
            <div className="w-[240px] -mx-1 -my-1">
              <div className="flex items-center gap-2.5 px-2 py-2">
                <Avatar name="Ariane Martin" size={36} />
                <div className="flex flex-col leading-tight">
                  <span className="text-[12.5px] font-semibold">Ariane Martin</span>
                  <span className="text-[10.5px] text-[var(--color-ink-4)]">
                    ariane.m@apex-ops.com
                  </span>
                </div>
              </div>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close();
                  router.push("/settings");
                }}
                icon={<I.Settings size={13} />}
                shortcut="⌘,"
              >
                Settings
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  router.push("/security");
                }}
                icon={<I.Shield size={13} />}
              >
                Security
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  close();
                  router.push("/audit");
                }}
                icon={<I.Document size={13} />}
              >
                Audit log
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close();
                  push({
                    title: "Theme toggled",
                    description: "Dark mode coming in v1.1.",
                  });
                }}
                icon={<I.Eye size={13} />}
              >
                Appearance
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onClick={() => {
                  close();
                  handleLogout();
                }}
                icon={<I.Logout size={13} />}
                tone="danger"
              >
                Sign out
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
