import Link from "next/link";
import { I } from "@/components/Icon";
import { AreaChart, Avatar, Card, CardHeader, Pill, SecureChip, Sparkline, StatusPill } from "@/components/ui";
import { DEPOSITS, TRADING_ACCOUNTS, WITHDRAWALS, fmtDate, fmtMoney } from "@/lib/mock";

export default function PortalOverviewPage() {
  // Use Sebastian Lindqvist as the logged-in client
  const me = TRADING_ACCOUNTS.filter((a) => a.clientApexId === "APX-100482");
  const myDeposits = DEPOSITS.filter((d) => d.clientApexId === "APX-100482");
  const myWithdrawals = WITHDRAWALS.filter((w) => w.clientApexId === "APX-100482");
  const equityTotal = me.reduce((acc, a) => acc + a.equity, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">
            Monday · 25 May 2026
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.01em]">Welcome back, Sebastian.</h1>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/portal/deposit" className="btn-primary !h-10">
            <I.ArrowDownLeft size={14} />
            Deposit
          </Link>
          <Link href="/portal/withdraw" className="btn-secondary !h-10">
            <I.ArrowUpRight size={14} />
            Withdraw
          </Link>
        </div>
      </div>

      {/* Hero balance */}
      <Card padding="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Total equity
              </span>
              <SecureChip tone="brand">held by FPG</SecureChip>
            </div>
            <div className="flex items-end gap-3">
              <div className="tabular text-[40px] font-semibold leading-none tracking-[-0.02em]">
                {fmtMoney(equityTotal, "USD")}
              </div>
              <span className="inline-flex items-baseline gap-1 pb-2 text-[12.5px] font-medium text-[var(--color-success)]">
                <I.TrendingUp size={12} />
                +$1,612.55 today
                <span className="text-[var(--color-ink-4)] font-normal">(+1.6%)</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Balance" value={fmtMoney(96_800, "USD")} />
              <Metric label="Open PnL" value={fmtMoney(1_612.55, "USD")} tone="success" />
              <Metric label="Free margin" value={fmtMoney(85_992.55, "USD")} />
              <Metric label="Margin used" value="11.2%" />
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-[var(--color-ink-4)]">
              <I.Lock size={11} />
              Funds segregated by Fortune Prime Global · APEX never holds your money.
            </div>
          </div>
          <div className="relative border-t md:border-l md:border-t-0 border-[var(--color-line)] p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Equity · 30 days
              </span>
              <span className="text-[11px] text-[var(--color-ink-3)]">USD</span>
            </div>
            <AreaChart
              data={[82, 84, 81, 86, 88, 87, 92, 94, 91, 95, 96, 98, 97, 99, 100, 99, 101, 102, 100, 103, 104, 105, 104, 106, 107, 105, 108, 110, 112]}
              height={140}
            />
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat
          label="Active accounts"
          value={`${me.length}`}
          hint="MT5 Live · MT5 Demo"
          icon="ChartBar"
        />
        <QuickStat
          label="Net deposit"
          value={fmtMoney(96_800, "USD")}
          hint="Lifetime"
          icon="Wallet"
        />
        <QuickStat
          label="Volume (30d)"
          value="$4.82M"
          hint="48 trades · 16 lots"
          icon="Activity"
        />
        <QuickStat
          label="Last login"
          value="Yesterday 19:42"
          hint="Paris · Safari"
          icon="Shield"
        />
      </div>

      {/* Accounts + Transactions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
            <div>
              <h3 className="text-[13.5px] font-semibold">Your trading accounts</h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                Hosted on FPG servers · live mirror
              </p>
            </div>
            <Link href="/portal/accounts" className="btn-ghost text-[var(--color-brand)]">
              Manage
              <I.ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {me.map((a) => (
              <Link
                key={a.id}
                href={`/portal/accounts/${a.login}`}
                className="flex flex-col gap-3 rounded-md border border-[var(--color-line)] bg-white p-4 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-brand-tint)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-ink)] text-[10px] font-bold text-white">
                      {a.platform}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="mono text-[12.5px] font-semibold">{a.login}</span>
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">
                        {a.accountType} · {a.mode}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                      Equity
                    </div>
                    <div className="tabular mt-0.5 text-[15px] font-semibold">
                      {fmtMoney(a.equity, a.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                      Free margin
                    </div>
                    <div className="tabular mt-0.5 text-[13px] text-[var(--color-ink-2)]">
                      {fmtMoney(a.freeMargin, a.currency)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-line-subtle)] pt-2 text-[11.5px] text-[var(--color-ink-4)]">
                  <span className="mono">{a.server} · {a.leverage}:1</span>
                  <span className="inline-flex items-center gap-1 text-[var(--color-brand)] font-medium">
                    View
                    <I.ChevronRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
            <Link
              href="/portal/onboarding/account"
              className="flex h-[148px] flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-[var(--color-line-strong)] bg-[var(--color-bg-subtle)] text-[12.5px] font-medium text-[var(--color-ink-3)] hover:border-[var(--color-brand-2)] hover:bg-[var(--color-brand-tint)] hover:text-[var(--color-brand)]"
            >
              <I.Plus size={16} />
              Open another account
            </Link>
          </div>
        </Card>

        {/* Tasks / notifications */}
        <Card padding="p-5">
          <CardHeader title="Your inbox" description="Latest from FPG and your account manager" />
          <ul className="flex flex-col divide-y divide-[var(--color-line-subtle)]">
            {[
              {
                tone: "info" as const,
                icon: "Shield" as const,
                title: "Annual KYC review due 2027-04-12",
                detail: "We'll remind you 30 days before.",
                time: "Today",
              },
              {
                tone: "warning" as const,
                icon: "Wallet" as const,
                title: "Withdrawal under review",
                detail: "40,000 EUR · FPG compliance is reviewing.",
                time: "2h ago",
              },
              {
                tone: "success" as const,
                icon: "CircleCheck" as const,
                title: "Deposit completed",
                detail: "$25,000 credited to FPG7740921-L1.",
                time: "Yesterday",
              },
              {
                tone: "neutral" as const,
                icon: "Mail" as const,
                title: "May monthly statement available",
                detail: "Download it from Documents.",
                time: "2 days",
              },
            ].map((n, i) => {
              const Icon = I[n.icon];
              return (
                <li key={i} className="flex items-start gap-2.5 py-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      n.tone === "info"
                        ? "bg-[var(--color-info-soft)] text-[var(--color-info)]"
                        : n.tone === "warning"
                          ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
                          : n.tone === "success"
                            ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                            : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
                    }`}
                  >
                    <Icon size={12} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-medium text-[var(--color-ink)]">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-[var(--color-ink-4)]">{n.time}</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--color-ink-3)]">{n.detail}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
          <div>
            <h3 className="text-[13.5px] font-semibold">Recent transactions</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Cleared by FPG · payment data never sent to APEX
            </p>
          </div>
          <Link href="/portal/transactions" className="btn-ghost text-[var(--color-brand)]">
            View all
            <I.ChevronRight size={12} />
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Method</th>
              <th>Account</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...myDeposits.map((d) => ({
                date: d.createdAt,
                type: "Deposit",
                method: d.method,
                account: d.account,
                amount: d.amount,
                currency: d.currency,
                status: d.status,
                inward: true,
              })),
              ...myWithdrawals.map((w) => ({
                date: w.createdAt,
                type: "Withdrawal",
                method: w.method,
                account: w.account,
                amount: w.amount,
                currency: w.currency,
                status: w.status,
                inward: false,
              })),
            ]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 6)
              .map((t, i) => (
                <tr key={i}>
                  <td className="text-[var(--color-ink-3)]">{fmtDate(t.date, { time: true })}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                      {t.inward ? (
                        <I.ArrowDownLeft size={12} className="text-[var(--color-success)]" />
                      ) : (
                        <I.ArrowUpRight size={12} className="text-[var(--color-brand-2)]" />
                      )}
                      {t.type}
                    </span>
                  </td>
                  <td className="text-[var(--color-ink-3)]">{t.method}</td>
                  <td className="mono text-[11.5px]">{t.account}</td>
                  <td
                    className={`text-right tabular font-semibold ${
                      t.inward ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {t.inward ? "+" : "−"}
                    {fmtMoney(t.amount, t.currency).replace(/^-/, "")}
                  </td>
                  <td>
                    <StatusPill status={t.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "danger"
        ? "text-[var(--color-danger)]"
        : "text-[var(--color-ink)]";
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </div>
      <div className={`tabular mt-1 text-[15px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof I;
}) {
  const Icon = I[icon];
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Icon size={15} />
      </span>
      <div className="flex flex-col">
        <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
          {label}
        </span>
        <span className="tabular text-[16px] font-semibold leading-tight text-[var(--color-ink)]">
          {value}
        </span>
        <span className="text-[10.5px] text-[var(--color-ink-4)]">{hint}</span>
      </div>
    </div>
  );
}
