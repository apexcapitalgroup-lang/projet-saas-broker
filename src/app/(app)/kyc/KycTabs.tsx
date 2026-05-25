"use client";

import * as React from "react";
import { I } from "@/components/Icon";
import { Dropdown, DropdownItem, DropdownLabel } from "@/components/Dropdown";
import { useToast } from "@/components/Toast";

interface TabDef {
  key: string;
  label: string;
  count: number;
}

interface KycTabsProps {
  tabs: TabDef[];
  activeKey?: string;
  onChange?: (key: string) => void;
}

export function KycTabs({ tabs, activeKey: controlled, onChange }: KycTabsProps) {
  const [internal, setInternal] = React.useState(tabs[0]?.key ?? "");
  const active = controlled ?? internal;
  function pick(k: string) {
    if (!onChange) setInternal(k);
    onChange?.(k);
  }
  return (
    <div className="flex items-center gap-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => pick(t.key)}
          className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium ${
            active === t.key
              ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
              : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
          }`}
        >
          {t.label}
          <span
            className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-semibold ${
              active === t.key
                ? "bg-white/60 text-[var(--color-brand)]"
                : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
            }`}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Interactive filter dropdown — emits the chosen option to the parent. */
export function KycFilterButton({
  label,
  options,
  value: controlled,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [internal, setInternal] = React.useState(options[0] ?? "All");
  const value = controlled ?? internal;
  return (
    <Dropdown
      align="right"
      trigger={(p) => (
        <button
          {...p}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]"
        >
          <span className="text-[var(--color-ink-4)]">{label}:</span>
          <span className="font-medium">{value}</span>
          <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
        </button>
      )}
    >
      {(close) => (
        <div className="w-[180px] -mx-1 -my-1">
          <DropdownLabel>{label}</DropdownLabel>
          {options.map((o) => (
            <DropdownItem
              key={o}
              onClick={() => {
                if (!onChange) setInternal(o);
                onChange?.(o);
                close();
              }}
              icon={
                value === o ? (
                  <I.Check size={12} className="text-[var(--color-brand-2)]" />
                ) : (
                  <span className="inline-block h-3 w-3" />
                )
              }
            >
              {o}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

/** Row Review button — currently scrolls to top + toasts the open. */
export function KycRowReview({
  apexId,
  clientName,
}: {
  apexId: string;
  clientName: string;
}) {
  const { push } = useToast();
  return (
    <button
      onClick={() => {
        push({
          title: `Reviewing ${clientName}`,
          description: `Loaded ${apexId} into the side panel.`,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="btn-ghost text-[var(--color-brand)]"
    >
      Review
      <I.ChevronRight size={12} />
    </button>
  );
}
