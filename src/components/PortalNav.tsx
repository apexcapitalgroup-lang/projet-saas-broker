"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "./Icon";
import { ApexMark } from "./Brand";
import { Avatar } from "./ui";

const NAV: { href: string; label: string; icon: keyof typeof I }[] = [
  { href: "/portal", label: "Overview", icon: "Dashboard" },
  { href: "/portal/accounts", label: "My accounts", icon: "ChartBar" },
  { href: "/portal/deposit", label: "Deposit", icon: "ArrowDownLeft" },
  { href: "/portal/withdraw", label: "Withdraw", icon: "ArrowUpRight" },
  { href: "/portal/transactions", label: "Transactions", icon: "Activity" },
  { href: "/portal/documents", label: "Documents", icon: "Document" },
  { href: "/portal/profile", label: "Profile & Security", icon: "Shield" },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-[228px] shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg)]">
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-line)] px-4">
        <ApexMark size={22} />
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[14.5px] font-semibold tracking-[-0.01em]">APEX</span>
          <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-[var(--color-ink-4)]">
            Client portal
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const Icon = I[item.icon];
            const active =
              item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={`nav-link ${active ? "is-active" : ""}`}>
                  <Icon
                    size={15}
                    className={active ? "text-[var(--color-brand)]" : "text-[var(--color-ink-4)]"}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-4)]">
          Need help?
        </div>
        <Link
          href="#"
          className="mt-2 mx-1 flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 hover:bg-[var(--color-brand-tint)]"
        >
          <I.Inbox size={14} className="mt-0.5 text-[var(--color-brand)]" />
          <div>
            <div className="text-[12px] font-semibold text-[var(--color-ink)]">Contact your manager</div>
            <div className="text-[10.5px] text-[var(--color-ink-4)]">Avg reply &lt; 2h on business days</div>
          </div>
        </Link>
      </nav>

      <div className="border-t border-[var(--color-line)] p-3">
        <Link
          href="/portal/profile"
          className="flex items-center gap-2.5 rounded-md p-2 hover:bg-[var(--color-bg-muted)]"
        >
          <Avatar name="Sebastian Lindqvist" size={32} />
          <div className="flex flex-1 flex-col leading-tight min-w-0">
            <span className="truncate text-[12.5px] font-semibold">Sebastian Lindqvist</span>
            <span className="truncate text-[10.5px] text-[var(--color-ink-4)]">APX-100482 · Live</span>
          </div>
          <I.Logout size={14} className="text-[var(--color-ink-4)]" />
        </Link>
      </div>
    </aside>
  );
}
