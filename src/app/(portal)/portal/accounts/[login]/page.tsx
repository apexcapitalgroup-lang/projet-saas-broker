import Link from "next/link";
import { notFound } from "next/navigation";
import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Card, CardHeader, Pill, StatusPill } from "@/components/ui";
import { TRADING_ACCOUNTS, fmtMoney } from "@/lib/mock";
import { EquityChartRange } from "./EquityChartRange";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ login: string }>;
}) {
  const { login } = await params;
  const a = TRADING_ACCOUNTS.find((x) => x.login === login);
  if (!a) notFound();

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-ink-4)]">
        <Link href="/portal/accounts" className="hover:text-[var(--color-ink)]">
          My accounts
        </Link>
        <I.ChevronRight size={12} />
        <span className="mono font-medium text-[var(--color-ink)]">{a.login}</span>
      </div>

      {/* Hero */}
      <Card padding="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--color-ink)] text-[12px] font-bold text-white">
              {a.platform}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="mono text-[18px] font-semibold">{a.login}</span>
                <Pill tone={a.mode === "Live" ? "brand" : "neutral"} dot={false}>
                  {a.mode}
                </Pill>
                <StatusPill status={a.status} />
              </div>
              <div className="mt-1 text-[12.5px] text-[var(--color-ink-3)]">
                {a.accountType} · {a.currency} · Leverage {a.leverage}:1 ·{" "}
                <span className="mono">{a.server}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/portal/deposit" className="btn-primary">
              <I.ArrowDownLeft size={14} />
              Deposit
            </Link>
            <Link href="/portal/withdraw" className="btn-secondary">
              <I.ArrowUpRight size={14} />
              Withdraw
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
          <Metric label="Equity" value={fmtMoney(a.equity, a.currency)} big />
          <Metric label="Balance" value={fmtMoney(a.balance, a.currency)} />
          <Metric label="Margin used" value={fmtMoney(a.margin, a.currency)} />
          <Metric label="Free margin" value={fmtMoney(a.freeMargin, a.currency)} />
        </div>
      </Card>

      {/* Chart + open positions */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="p-5">
          <CardHeader
            title="Equity curve"
            description="Mirror of FPG ledger · refresh every 60 seconds"
          />
          <EquityChartRange />
        </Card>

        <Card padding="p-5">
          <CardHeader title="Open positions" description="Live · streamed from MT5" />
          <ul className="flex flex-col gap-2 text-[12px]">
            {[
              ["EURUSD", "Buy", 1.5, 1.0842, 1.0876, +510],
              ["XAUUSD", "Buy", 0.4, 2384.5, 2398.2, +548],
              ["US100", "Sell", 0.8, 18840, 18762, +624],
              ["GBPUSD", "Buy", 0.5, 1.2641, 1.2664, -69],
            ].map(([sym, dir, lots, open, cur, pnl]) => (
              <li
                key={sym as string}
                className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded text-[9.5px] font-bold ${
                      (dir as string) === "Buy"
                        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    }`}
                  >
                    {(dir as string) === "Buy" ? "B" : "S"}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="mono font-semibold text-[var(--color-ink)]">{sym as string}</span>
                    <span className="text-[10.5px] text-[var(--color-ink-4)]">
                      {lots as number} lots · @{open as number}
                    </span>
                  </div>
                </div>
                <span
                  className={`tabular text-[12.5px] font-semibold ${
                    (pnl as number) > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                  }`}
                >
                  {(pnl as number) > 0 ? "+" : "−"}${Math.abs(pnl as number)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recent closed trades */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
          <div>
            <h3 className="text-[13.5px] font-semibold">Recent closed trades</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Last 7 days · all closed positions on this account
            </p>
          </div>
          <ActionButton
            label="Export CSV"
            icon="Download"
            variant="ghost"
            className="!text-[var(--color-brand)]"
            download={{
              filename: `${a.login}-trades.csv`,
              content:
                "ticket,symbol,side,lots,open_time,close_time,open_price,close_price,commission,swap,pnl\n#812441,EURUSD,Buy,2.0,2026-05-24T09:12,2026-05-24T11:42,1.0822,1.0851,-10,-1.2,580\n",
            }}
            toastTitle="Trade history exported"
            toastDescription={`${a.login} · last 7 days`}
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Open time</th>
              <th>Close time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th className="text-right">Lots</th>
              <th className="text-right">Open</th>
              <th className="text-right">Close</th>
              <th className="text-right">Commission</th>
              <th className="text-right">Swap</th>
              <th className="text-right">PnL</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["#812441", "2026-05-24 09:12", "2026-05-24 11:42", "EURUSD", "Buy", 2.0, 1.0822, 1.0851, -10, -1.2, 580],
              ["#812389", "2026-05-23 14:02", "2026-05-23 16:24", "XAUUSD", "Sell", 0.5, 2389.5, 2382.1, -5, 0, 370],
              ["#812371", "2026-05-23 09:14", "2026-05-23 12:01", "US100", "Buy", 1.0, 18712, 18762, -8, 0, 500],
              ["#812302", "2026-05-22 11:00", "2026-05-22 12:18", "GBPUSD", "Sell", 1.5, 1.2671, 1.2654, -8, 0, 255],
              ["#812254", "2026-05-22 08:11", "2026-05-22 09:34", "EURUSD", "Buy", 1.0, 1.0834, 1.0820, -5, 0, -140],
            ].map((row, i) => (
              <tr key={i}>
                <td className="mono">{row[0] as string}</td>
                <td className="text-[var(--color-ink-3)]">{row[1] as string}</td>
                <td className="text-[var(--color-ink-3)]">{row[2] as string}</td>
                <td className="mono">{row[3] as string}</td>
                <td>
                  <Pill tone={row[4] === "Buy" ? "success" : "danger"} dot={false}>
                    {row[4] as string}
                  </Pill>
                </td>
                <td className="text-right tabular">{row[5] as number}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">{row[6] as number}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">{row[7] as number}</td>
                <td className="text-right tabular text-[var(--color-ink-4)]">${row[8] as number}</td>
                <td className="text-right tabular text-[var(--color-ink-4)]">{row[9] as number}</td>
                <td
                  className={`text-right tabular font-semibold ${
                    (row[10] as number) > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                  }`}
                >
                  {(row[10] as number) > 0 ? "+" : "−"}${Math.abs(row[10] as number)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Metric({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </div>
      <div className={`tabular mt-1 font-semibold text-[var(--color-ink)] ${big ? "text-[24px]" : "text-[15px]"}`}>
        {value}
      </div>
    </div>
  );
}
