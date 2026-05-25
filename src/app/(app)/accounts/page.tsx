import Link from "next/link";
import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Avatar, Card, CardHeader, Kpi, Pill, SectionHeader, StatusPill } from "@/components/ui";
import { TRADING_ACCOUNTS, fmtDate, fmtMoney, fmtNumber } from "@/lib/mock";

export default function AccountsPage() {
  const totalAum = TRADING_ACCOUNTS.reduce((acc, a) => acc + a.equity * (a.currency === "JPY" ? 0.0064 : 1), 0);
  const live = TRADING_ACCOUNTS.filter((a) => a.mode === "Live").length;
  const demo = TRADING_ACCOUNTS.filter((a) => a.mode === "Demo").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Trading accounts"
        description="MT4 / MT5 accounts hosted by FPG. APEX never touches client funds — balances are read-only mirrors."
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="Refresh balances"
              icon="Refresh"
              variant="secondary"
              refresh
              toastTitle="Balances refreshed"
              toastDescription="Pulled live mirror from FPG · 946 accounts updated"
            />
            <ActionButton
              label="Open account"
              icon="Plus"
              variant="primary"
              href="/portal-signup"
              newTab
              toastTitle="Account onboarding"
              toastDescription="Use the portal signup flow to open a live account."
            />
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Assets under management"
          value={fmtMoney(totalAum * 380, "USD", { compact: true })}
          delta="+6.4%"
          deltaTone="success"
          hint="Real-time mirror from FPG"
        />
        <Kpi
          label="Active live accounts"
          value={fmtNumber(live * 36 + 254)}
          delta="+18"
          deltaTone="success"
        />
        <Kpi
          label="Demo accounts"
          value={fmtNumber(demo * 84 + 612)}
          delta="+44"
          deltaTone="success"
        />
        <Kpi
          label="Margin utilisation"
          value="22.8%"
          delta="−1.4 pts"
          deltaTone="success"
          hint="Across all live accounts"
        />
      </div>

      {/* Distribution row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card padding="p-5">
          <CardHeader title="By account type" description="Live accounts only" />
          {[
            ["Standard", 0.42, "var(--color-brand-2)"],
            ["Pro", 0.28, "var(--color-brand-3)"],
            ["Raw", 0.16, "var(--color-accent-purple)"],
            ["ECN", 0.11, "var(--color-accent-teal)"],
            ["Islamic", 0.03, "var(--color-warning)"],
          ].map(([name, pct, color]) => (
            <div key={name as string} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[12px]">
                <span className="text-[var(--color-ink-2)]">{name as string}</span>
                <span className="tabular text-[var(--color-ink-3)]">{((pct as number) * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(pct as number) * 100}%`, background: color as string }}
                />
              </div>
            </div>
          ))}
        </Card>

        <Card padding="p-5">
          <CardHeader title="By currency" description="Base currency of account" />
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["USD", 248, "var(--color-brand-2)"],
              ["EUR", 78, "var(--color-brand-3)"],
              ["GBP", 28, "var(--color-accent-purple)"],
              ["JPY", 18, "var(--color-accent-teal)"],
            ].map(([cur, count, color]) => (
              <div
                key={cur as string}
                className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3"
              >
                <div
                  className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                  style={{ background: color as string }}
                >
                  {cur as string}
                </div>
                <div className="tabular text-[14px] font-semibold text-[var(--color-ink)]">{count as number}</div>
                <div className="text-[10.5px] text-[var(--color-ink-4)]">accounts</div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="p-5">
          <CardHeader title="Server load" description="FPG-side · live ping" />
          {[
            ["FPG-Live-01", 142, "EU", 38],
            ["FPG-Live-02", 196, "EU", 52],
            ["FPG-Live-03", 88, "APAC", 22],
            ["FPG-Demo-01", 612, "Demo", 18],
          ].map(([server, accounts, region, load]) => (
            <div key={server as string} className="mb-2 last:mb-0 flex items-center gap-3">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="mono text-[12px] text-[var(--color-ink)] flex-1">{server as string}</span>
              <span className="text-[11px] text-[var(--color-ink-4)]">{region as string}</span>
              <span className="tabular text-[11.5px] text-[var(--color-ink-3)]">
                {accounts as number} acc
              </span>
              <div className="w-14 h-1 rounded-full bg-[var(--color-bg-muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-brand-2)] rounded-full"
                  style={{ width: `${load as number}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Table */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All accounts" count={946} active />
            <Tab label="Live" count={live * 36 + 254} />
            <Tab label="Demo" count={demo * 84 + 612} />
            <Tab label="Suspended" count={4} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px]">
              <I.Search size={12} className="text-[var(--color-ink-4)]" />
              <input
                placeholder="Login or client name"
                className="w-[200px] bg-transparent outline-none placeholder:text-[var(--color-ink-4)]"
              />
            </div>
            <FilterButton label="Platform" value="All" />
            <FilterButton label="Server" value="All" />
            <FilterButton label="Type" value="All" />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Client</th>
              <th>Platform · Type</th>
              <th>Server</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Equity</th>
              <th className="text-right">Margin</th>
              <th>Leverage</th>
              <th>Status</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            {TRADING_ACCOUNTS.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-brand-soft)] text-[9px] font-bold text-[var(--color-brand)]">
                      {a.platform}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="mono text-[var(--color-ink)]">{a.login}</span>
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">
                        {a.mode} · {a.currency}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <Link href={`/clients/${a.clientApexId}`} className="flex items-center gap-2 hover:text-[var(--color-brand)]">
                    <Avatar name={a.clientName} size={22} />
                    <span className="text-[12px] font-medium text-[var(--color-ink-2)]">{a.clientName}</span>
                  </Link>
                </td>
                <td>
                  <Pill tone="neutral" dot={false} className="!font-medium">
                    {a.accountType}
                  </Pill>
                </td>
                <td className="mono">{a.server}</td>
                <td className="text-right tabular font-medium">{fmtMoney(a.balance, a.currency)}</td>
                <td className="text-right tabular">{fmtMoney(a.equity, a.currency)}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">
                  {fmtMoney(a.margin, a.currency)}
                </td>
                <td className="tabular text-[var(--color-ink-2)]">{a.leverage}:1</td>
                <td>
                  <StatusPill status={a.status} />
                </td>
                <td className="text-[var(--color-ink-3)]">{fmtDate(a.openedAt, { rel: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Tab({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <button
      className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium ${
        active
          ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
          : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-semibold ${
            active
              ? "bg-white/60 text-[var(--color-brand)]"
              : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FilterButton({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)]">
      <span className="text-[var(--color-ink-4)]">{label}:</span>
      <span className="font-medium">{value}</span>
      <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
    </button>
  );
}
