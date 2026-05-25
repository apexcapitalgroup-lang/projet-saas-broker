"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "./Icon";
import { ApexMark } from "./Brand";

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof I;
  badge?: { text: string; tone?: "warning" | "danger" | "brand" };
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: "Dashboard" },
      { href: "/clients", label: "Clients", icon: "Users", badge: { text: "382", tone: "brand" } },
      { href: "/kyc", label: "KYC / KYB", icon: "Shield", badge: { text: "24", tone: "warning" } },
      { href: "/accounts", label: "Trading accounts", icon: "ChartBar" },
    ],
  },
  {
    label: "Cash flow",
    items: [
      { href: "/deposits", label: "Deposits", icon: "ArrowDownLeft" },
      { href: "/withdrawals", label: "Withdrawals", icon: "ArrowUpRight", badge: { text: "3", tone: "warning" } },
      { href: "/reconciliation", label: "Reconciliation", icon: "Wallet", badge: { text: "1", tone: "danger" } },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/reporting", label: "Reporting", icon: "Activity" },
      { href: "/commissions", label: "Commissions", icon: "TrendingUp" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/webhooks", label: "Webhooks & API", icon: "Webhook", badge: { text: "1", tone: "warning" } },
      { href: "/audit", label: "Audit log", icon: "Document" },
      { href: "/security", label: "Security", icon: "Lock" },
      { href: "/settings", label: "Settings", icon: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[244px] shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg)]">
      {/* brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-line)] px-4">
        <ApexMark size={22} />
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[14.5px] font-semibold tracking-[-0.01em]">APEX</span>
          <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink-4)]">
            Console
          </span>
        </div>
      </div>

      {/* org switcher */}
      <div className="border-b border-[var(--color-line)] px-3 py-3">
        <button className="flex w-full items-center justify-between rounded-md border border-[var(--color-line)] bg-white px-2.5 py-2 text-left hover:bg-[var(--color-brand-tint)]">
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand-soft)] text-[10px] font-bold text-[var(--color-brand)]">
              APX
            </span>
            <span className="flex flex-col">
              <span className="text-[12.5px] font-semibold leading-tight">APEX Production</span>
              <span className="text-[10.5px] text-[var(--color-ink-4)]">prod · eu-west-1</span>
            </span>
          </span>
          <I.ChevronDown size={14} className="text-[var(--color-ink-4)]" />
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-5" : ""}>
            {group.label && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-4)]">
                {group.label}
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = I[item.icon];
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`nav-link ${active ? "is-active" : ""}`}>
                      <Icon size={15} className={active ? "text-[var(--color-brand)]" : "text-[var(--color-ink-4)]"} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-semibold ${
                            item.badge.tone === "warning"
                              ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                              : item.badge.tone === "danger"
                                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                                : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                          }`}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* footer: FPG status */}
      <div className="border-t border-[var(--color-line)] p-3">
        <Link
          href="/webhooks"
          className="flex flex-col gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 hover:bg-[var(--color-brand-tint)]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              FPG API
            </span>
            <span className="text-[10.5px] text-[var(--color-ink-4)]">99.98%</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10.5px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--color-ink-4)]">p50</span>
              <span className="mono text-[var(--color-ink)]">82ms</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--color-ink-4)]">p95</span>
              <span className="mono text-[var(--color-ink)]">211ms</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--color-ink-4)]">err</span>
              <span className="mono text-[var(--color-ink)]">0.02%</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
