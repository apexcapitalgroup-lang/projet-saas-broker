"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { Dropdown, DropdownItem, DropdownLabel } from "@/components/Dropdown";
import { I } from "@/components/Icon";
import { useToast } from "@/components/Toast";

const RANGES = ["Today", "Last 7 days", "Last 30 days", "Last 90 days", "Year to date", "Custom"];

export function DashboardHeaderActions() {
  const [range, setRange] = React.useState("Last 30 days");
  const router = useRouter();
  const { push } = useToast();

  return (
    <div className="flex items-center gap-2">
      <ActionButton
        label="Refresh"
        icon="Refresh"
        variant="ghost"
        refresh
        toastTitle="Data refreshed"
        toastDescription="Pulled the latest from FPG · 99.98% uptime"
      />
      <Dropdown
        align="right"
        trigger={(p) => (
          <button
            {...p}
            className="btn-secondary"
          >
            <I.Calendar size={14} />
            {range}
            <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
          </button>
        )}
      >
        {(close) => (
          <div className="w-[200px] -mx-1 -my-1">
            <DropdownLabel>Time range</DropdownLabel>
            {RANGES.map((r) => (
              <DropdownItem
                key={r}
                icon={
                  r === range ? (
                    <I.Check size={12} className="text-[var(--color-brand-2)]" />
                  ) : (
                    <span className="inline-block h-3 w-3" />
                  )
                }
                onClick={() => {
                  setRange(r);
                  close();
                  push({
                    title: `Range: ${r}`,
                    description: "Charts and KPIs updated.",
                  });
                  router.refresh();
                }}
              >
                {r}
              </DropdownItem>
            ))}
          </div>
        )}
      </Dropdown>
      <ActionButton
        label="Export"
        icon="Download"
        variant="primary"
        download={{
          filename: "apex-dashboard-2026-05.csv",
          content:
            "metric,value,unit\nactive_clients,382,count\ntrading_volume_30d,2180000000,USD\nnet_deposit_30d,12400000,USD\n",
        }}
        toastTitle="Dashboard export ready"
        toastDescription="Downloaded apex-dashboard-2026-05.csv"
      />
    </div>
  );
}
