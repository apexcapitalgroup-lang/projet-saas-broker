import Link from "next/link";
import { notFound } from "next/navigation";
import { I } from "@/components/Icon";
import {
  Avatar,
  Card,
  CardHeader,
  Pill,
  SecureChip,
  Sparkline,
  StatusPill,
} from "@/components/ui";
import {
  CLIENTS,
  DEPOSITS,
  TRADING_ACCOUNTS,
  WITHDRAWALS,
  fmtDate,
  fmtMoney,
  fmtNumber,
} from "@/lib/mock";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = CLIENTS.find((c) => c.apexId === id);
  if (!client) notFound();

  const accounts = TRADING_ACCOUNTS.filter((a) => a.clientApexId === client.apexId);
  const deposits = DEPOSITS.filter((d) => d.clientApexId === client.apexId);
  const withdrawals = WITHDRAWALS.filter((w) => w.clientApexId === client.apexId);

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-4)]">
          <Link href="/clients" className="hover:text-[var(--color-ink)]">
            Clients
          </Link>
          <I.ChevronRight size={12} />
          <span className="font-medium text-[var(--color-ink)]">{client.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost">
            <I.Mail size={14} />
            Contact
          </button>
          <button className="btn-secondary">
            <I.Document size={14} />
            View KYC pack
          </button>
          <button className="btn-secondary">
            <I.MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Header card */}
      <Card padding="p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={client.name} size={56} />
          <div className="flex flex-1 min-w-[280px] flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{client.name}</h1>
              <StatusPill status={client.status} />
              <StatusPill status={client.kyc} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--color-ink-3)]">
              <span className="inline-flex items-center gap-1.5">
                <I.Mail size={12} />
                {client.email}
              </span>
              <span className="text-[var(--color-ink-5)]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <I.Globe size={12} />
                {client.country}
              </span>
              <span className="text-[var(--color-ink-5)]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <I.Users size={12} />
                {client.type}
              </span>
              <span className="text-[var(--color-ink-5)]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <I.Calendar size={12} />
                Joined {fmtDate(client.registeredAt)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
              <SecureChip>APEX ID · {client.apexId}</SecureChip>
              <SecureChip tone="brand">FPG ID · {client.fpgId || "pending"}</SecureChip>
              <SecureChip>IB · {client.ibCode}</SecureChip>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 min-w-[220px]">
            <Metric label="Total deposits" value={fmtMoney(client.totalDeposits, "USD")} />
            <Metric label="Net deposit" value={fmtMoney(client.netDeposit, "USD")} />
            <Metric label="Volume (30d)" value={fmtMoney(client.volume30d, "USD", { compact: true })} />
            <Metric label="Accounts" value={`${client.accounts}`} />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-line)] -mt-1">
        {[
          ["Overview", true],
          ["Accounts", false],
          ["KYC documents", false],
          ["Deposits", false],
          ["Withdrawals", false],
          ["Volumes", false],
          ["Audit log", false],
        ].map(([label, active]) => (
          <button
            key={label as string}
            className={`relative h-9 px-3 text-[12.5px] font-medium ${
              active
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-ink-4)] hover:text-[var(--color-ink-2)]"
            }`}
          >
            {label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-[var(--color-brand-2)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          {/* Trading accounts */}
          <Card padding="p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
              <div>
                <h3 className="text-[13px] font-semibold tracking-tight">Trading accounts</h3>
                <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                  Managed by FPG · MT4/MT5 server: FPG-Live-XX
                </p>
              </div>
              <button className="btn-ghost text-[var(--color-brand)]">
                <I.Plus size={12} />
                New account
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Login</th>
                  <th>Platform · Type</th>
                  <th>Server</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Equity</th>
                  <th className="text-right">Margin used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-[var(--color-ink-4)]">
                      No trading account yet.
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="mono text-[var(--color-ink)]">{a.login}</span>
                        <div className="text-[10.5px] text-[var(--color-ink-4)]">
                          {a.mode} · {a.currency} · {a.leverage}:1
                        </div>
                      </td>
                      <td>
                        <span className="text-[var(--color-ink-2)]">{a.platform}</span>
                        <span className="text-[var(--color-ink-5)]"> · </span>
                        <span className="text-[var(--color-ink-3)]">{a.accountType}</span>
                      </td>
                      <td className="mono">{a.server}</td>
                      <td className="text-right tabular font-medium">
                        {fmtMoney(a.balance, a.currency)}
                      </td>
                      <td className="text-right tabular">{fmtMoney(a.equity, a.currency)}</td>
                      <td className="text-right tabular text-[var(--color-ink-3)]">
                        {fmtMoney(a.margin, a.currency)}
                      </td>
                      <td>
                        <StatusPill status={a.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {/* Activity timeline */}
          <Card padding="p-5">
            <CardHeader title="Recent activity" description="Last 14 days · across APEX & FPG" />
            <ol className="relative ml-2 flex flex-col gap-3 border-l border-dashed border-[var(--color-line)] pl-4">
              {[
                {
                  time: "2026-05-25T08:00Z",
                  title: "Withdrawal under review",
                  body: "FPG compliance picked up the request (40,000 EUR).",
                  tone: "info" as const,
                  icon: "ArrowUpRight" as const,
                },
                {
                  time: "2026-05-24T11:14Z",
                  title: "Withdrawal completed",
                  body: "FPG-WD-X4421 · 8,000 USD · Visa / Mastercard refund.",
                  tone: "success" as const,
                  icon: "CircleCheck" as const,
                },
                {
                  time: "2026-05-22T15:42Z",
                  title: "Leverage changed",
                  body: "FPG7740964-L1 from 200:1 to 100:1 (compliance request).",
                  tone: "neutral" as const,
                  icon: "Sliders" as const,
                },
                {
                  time: "2026-05-12T07:14Z",
                  title: "KYC reviewed (annual)",
                  body: "Documents refreshed · approved automatically.",
                  tone: "success" as const,
                  icon: "Shield" as const,
                },
              ].map((e, i) => {
                const Icon = I[e.icon];
                const tone = e.tone;
                return (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                        tone === "success"
                          ? "border-[var(--color-success-soft)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
                          : tone === "info"
                            ? "border-[var(--color-info-soft)] bg-[var(--color-info-soft)] text-[var(--color-info)]"
                            : "border-[var(--color-line)] bg-white text-[var(--color-ink-3)]"
                      }`}
                    >
                      <Icon size={11} />
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12.5px] font-medium text-[var(--color-ink)]">
                        {e.title}
                      </span>
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">
                        {fmtDate(e.time, { time: true })}
                      </span>
                    </div>
                    <p className="text-[12px] text-[var(--color-ink-3)]">{e.body}</p>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Volume chart per instrument */}
          <Card padding="p-5">
            <CardHeader
              title="Volume breakdown (30 days)"
              description="By instrument · for revenue/volume share calculation"
              actions={
                <button className="btn-ghost text-[var(--color-brand)]">
                  <I.Download size={12} /> Export
                </button>
              }
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                ["EURUSD", 0.62, 2_984_400],
                ["XAUUSD", 0.21, 1_011_240],
                ["GBPUSD", 0.09, 433_800],
                ["US100", 0.08, 385_600],
              ].map(([sym, pct, vol]) => (
                <div
                  key={sym as string}
                  className="flex items-center gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[10.5px] font-bold text-[var(--color-brand)]">
                    {sym}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[11.5px] text-[var(--color-ink-3)]">
                      <span>{sym as string}</span>
                      <span className="tabular font-medium text-[var(--color-ink)]">
                        ${fmtNumber(vol as number, { compact: true })}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand-2)]"
                        style={{ width: `${(pct as number) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="tabular w-12 text-right text-[11px] text-[var(--color-ink-4)]">
                    {((pct as number) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-3">
          <Card padding="p-5">
            <CardHeader title="Compliance" />
            <dl className="flex flex-col gap-2.5 text-[12.5px]">
              <DRow label="KYC tier" value="Tier 2 · Enhanced" />
              <DRow label="Risk score" value={<span className="text-[var(--color-success)] font-semibold">Low · 2.1 / 10</span>} />
              <DRow label="PEP / sanctions" value="Clear" />
              <DRow label="Source of funds" value="Verified · employment" />
              <DRow label="Annual review" value="Due 2027-04-12" />
              <DRow label="US person" value="No" />
            </dl>
            <button className="btn-secondary mt-4 w-full">
              <I.Eye size={14} />
              View full KYC pack
            </button>
          </Card>

          <Card padding="p-5">
            <CardHeader title="Consents" />
            <ul className="flex flex-col gap-2 text-[12px]">
              {[
                ["Terms & Conditions", "2026-04-12 09:14 UTC"],
                ["Risk disclosure", "2026-04-12 09:14 UTC"],
                ["Execution policy", "2026-04-12 09:14 UTC"],
                ["Privacy notice", "2026-04-12 09:14 UTC"],
                ["Marketing opt-in", "—"],
              ].map(([title, time]) => (
                <li key={title} className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 text-[var(--color-ink-2)]">
                    {time === "—" ? (
                      <I.CircleX size={12} className="text-[var(--color-ink-5)]" />
                    ) : (
                      <I.CircleCheck size={12} className="text-[var(--color-success)]" />
                    )}
                    {title}
                  </span>
                  <span className="mono text-[10.5px] text-[var(--color-ink-4)]">{time}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="p-5">
            <CardHeader title="Onboarding signal" />
            <dl className="flex flex-col gap-2 text-[12px]">
              <DRow label="Origin" value="apex.com · /register" />
              <DRow label="UTM source" value="newsletter · 04-2026" />
              <DRow label="Registration IP" value="46.193.4.182" />
              <DRow label="User agent" value="macOS · Safari 17" />
              <DRow label="Language" value="EN" />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </span>
      <span className="tabular text-[14px] font-semibold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-line-subtle)] pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[11.5px] text-[var(--color-ink-4)]">{label}</dt>
      <dd className="text-right text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
