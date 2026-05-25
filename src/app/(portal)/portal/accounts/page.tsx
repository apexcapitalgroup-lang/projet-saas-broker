import Link from "next/link";
import { I } from "@/components/Icon";
import { Card, Pill, SectionHeader, StatusPill } from "@/components/ui";
import { TRADING_ACCOUNTS, fmtDate, fmtMoney } from "@/lib/mock";

export default function PortalAccountsPage() {
  const me = TRADING_ACCOUNTS.filter((a) => a.clientApexId === "APX-100482");

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="My accounts"
        description="All your MetaTrader accounts hosted by Fortune Prime Global."
        actions={
          <Link href="/portal/onboarding/account" className="btn-primary">
            <I.Plus size={14} />
            Open account
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {me.map((a) => (
          <Card key={a.id} padding="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--color-ink)] text-[11.5px] font-bold text-white">
                  {a.platform}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[14px] font-semibold">{a.login}</span>
                    <Pill tone={a.mode === "Live" ? "brand" : "neutral"} dot={false}>
                      {a.mode}
                    </Pill>
                  </div>
                  <div className="text-[11.5px] text-[var(--color-ink-4)]">
                    {a.accountType} · {a.currency} · {a.leverage}:1
                  </div>
                </div>
              </div>
              <StatusPill status={a.status} />
            </div>

            <div className="my-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                  Equity
                </div>
                <div className="tabular mt-1 text-[20px] font-semibold">
                  {fmtMoney(a.equity, a.currency)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                  Balance
                </div>
                <div className="tabular mt-1 text-[20px] font-semibold text-[var(--color-ink-2)]">
                  {fmtMoney(a.balance, a.currency)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                  Margin used
                </div>
                <div className="tabular mt-1 text-[13px] text-[var(--color-ink-3)]">
                  {fmtMoney(a.margin, a.currency)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
                  Free margin
                </div>
                <div className="tabular mt-1 text-[13px] text-[var(--color-ink-3)]">
                  {fmtMoney(a.freeMargin, a.currency)}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                MetaTrader credentials
              </div>
              <CredRow label="Login" value={a.login} />
              <CredRow label="Server" value={a.server} />
              <CredRow label="Investor password" value="••••••••••••" sensitive />
              <CredRow label="Main password" value="last set 12 Apr · reset to change" sensitive />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Link
                href={`/portal/accounts/${a.login}`}
                className="btn-ghost text-[var(--color-brand)]"
              >
                Details
                <I.ChevronRight size={12} />
              </Link>
              <div className="flex items-center gap-2">
                <Link href="/portal/deposit" className="btn-secondary !h-8">
                  <I.ArrowDownLeft size={12} />
                  Deposit
                </Link>
                <Link href="/portal/withdraw" className="btn-secondary !h-8">
                  <I.ArrowUpRight size={12} />
                  Withdraw
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Download platforms */}
      <Card padding="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">Get the trading apps</h3>
            <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)]">
              Connect to your account from desktop, mobile and web — the credentials above work
              everywhere.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["macOS", "Windows", "iOS", "Android", "Web Trader"].map((p) => (
              <a
                key={p}
                href="#"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-white px-3 text-[12px] font-medium text-[var(--color-ink-2)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-brand-tint)]"
              >
                <I.Download size={12} />
                {p}
              </a>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function CredRow({
  label,
  value,
  sensitive,
}: {
  label: string;
  value: string;
  sensitive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] py-1.5 last:border-b-0">
      <span className="text-[11.5px] text-[var(--color-ink-4)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="mono text-[12px] text-[var(--color-ink-2)]">{value}</span>
        {sensitive ? (
          <>
            <button className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">
              <I.Eye size={12} />
            </button>
            <button className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">
              <I.Refresh size={12} />
            </button>
          </>
        ) : (
          <button className="text-[var(--color-ink-4)] hover:text-[var(--color-ink)]">
            <I.Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
