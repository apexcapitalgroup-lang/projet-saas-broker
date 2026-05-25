import { I } from "@/components/Icon";
import { AreaChart, BarChart, Card, CardHeader, Kpi, SectionHeader, Sparkline } from "@/components/ui";
import { CLIENTS, NET_DEPOSIT_12M, VOLUME_SERIES_12M, fmtMoney, fmtNumber } from "@/lib/mock";

export default function ReportingPage() {
  const top = [...CLIENTS]
    .filter((c) => c.volume30d > 0)
    .sort((a, b) => b.volume30d - a.volume30d)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Commercial & financial reporting"
        description="Volume, net deposit, profit share and revenue share — sourced directly from FPG."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <I.Calendar size={14} />
              Last 30 days
              <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
            </button>
            <button className="btn-secondary">
              <I.Download size={14} />
              CSV
            </button>
            <button className="btn-primary">
              <I.Document size={14} />
              Monthly statement
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Trading volume (30d)"
          value={`$${fmtNumber(2.18, { compact: true, suffix: "B" })}`}
          delta="+18.2%"
          deltaTone="success"
          hint="48 instruments"
          spark={[82, 88, 110, 105, 121, 145, 138, 155, 162, 158, 174, 185, 196, 188, 204, 219, 214, 232, 248, 256, 244, 262, 281, 274, 290, 312]}
        />
        <Kpi
          label="Net deposit (30d)"
          value={fmtMoney(12_400_000, "USD", { compact: true })}
          delta="+9.1%"
          deltaTone="success"
          spark={[18, 22, 26, 24, 31, 28, 35, 33, 41, 39, 48, 52, 56, 58, 62, 64, 71, 69, 78, 82]}
        />
        <Kpi
          label="Volume share (forecast)"
          value={fmtMoney(184_240, "USD")}
          delta="+22.6%"
          deltaTone="success"
          hint="65% to forecast"
        />
        <Kpi
          label="Effective rate"
          value="$8.45 / lot"
          delta="+$0.18"
          deltaTone="success"
          hint="Weighted across products"
        />
      </div>

      {/* Volume chart */}
      <Card padding="p-5">
        <CardHeader
          title="Volume vs net deposit · 12 months"
          description="Billions USD, normalised. Source: FPG /ib/APEX/volumes & /reconciliation"
          actions={
            <div className="flex items-center gap-1">
              <button className="btn-ghost text-[var(--color-brand)]">Volume</button>
              <button className="btn-ghost">Lots</button>
              <button className="btn-ghost">PnL</button>
            </div>
          }
        />
        <AreaChart data={VOLUME_SERIES_12M} series2={NET_DEPOSIT_12M.map((v) => v * 2)} height={240} />
        <div className="mt-2 grid grid-cols-12 gap-1 text-center text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
          {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Instruments */}
        <Card className="lg:col-span-2" padding="p-5">
          <CardHeader
            title="Top instruments · last 30 days"
            description="By traded notional volume"
            actions={
              <button className="btn-ghost text-[var(--color-brand)]">
                <I.Download size={12} />
                Export
              </button>
            }
          />
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Asset class</th>
                <th className="text-right">Lots</th>
                <th className="text-right">Notional volume</th>
                <th className="text-right">Trades</th>
                <th className="text-right">Avg trade size</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["EURUSD", "FX major", 42_180, 1_205_400_000, 8412, 142800, [10, 14, 18, 22, 24, 28, 32]],
                ["XAUUSD", "Metals", 8_120, 412_400_000, 2218, 188_000, [12, 16, 14, 18, 24, 28, 32]],
                ["GBPUSD", "FX major", 6_440, 182_400_000, 1810, 100_800, [8, 10, 12, 14, 18, 22, 28]],
                ["US100", "Indices", 5_840, 154_800_000, 1644, 94_100, [6, 8, 12, 14, 16, 20, 24]],
                ["BTCUSD", "Crypto", 2_120, 96_800_000, 884, 109_500, [4, 6, 8, 10, 14, 18, 22]],
                ["USDJPY", "FX major", 4_280, 82_400_000, 1290, 63_900, [8, 8, 10, 10, 12, 14, 16]],
              ].map(([sym, cls, lots, vol, trades, avg, trend]) => (
                <tr key={sym as string}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand-soft)] text-[9.5px] font-bold text-[var(--color-brand)]">
                        {(sym as string).slice(0, 3)}
                      </span>
                      <span className="mono text-[var(--color-ink)]">{sym as string}</span>
                    </div>
                  </td>
                  <td className="text-[var(--color-ink-3)]">{cls as string}</td>
                  <td className="text-right tabular">{fmtNumber(lots as number)}</td>
                  <td className="text-right tabular font-medium">
                    ${fmtNumber(vol as number, { compact: true })}
                  </td>
                  <td className="text-right tabular text-[var(--color-ink-3)]">{fmtNumber(trades as number)}</td>
                  <td className="text-right tabular text-[var(--color-ink-3)]">
                    ${fmtNumber(avg as number)}
                  </td>
                  <td>
                    <Sparkline data={trend as number[]} width={64} height={20} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Top clients by volume */}
        <Card padding="p-5">
          <CardHeader title="Top clients · 30d volume" description="Active clients only" />
          <ul className="flex flex-col gap-2.5">
            {top.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[10px] font-semibold text-[var(--color-ink-3)]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-[var(--color-ink)]">{c.name}</div>
                  <div className="mono text-[10.5px] text-[var(--color-ink-4)]">{c.apexId}</div>
                </div>
                <span className="tabular text-[12.5px] font-semibold text-[var(--color-ink)]">
                  {fmtMoney(c.volume30d, "USD", { compact: true })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Net Deposit + Commission breakdown */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card padding="p-5">
          <CardHeader title="Cash flow · last 30 days" description="Daily deposits vs withdrawals" />
          <div className="relative h-[200px]">
            <BarChart
              data={[
                160, 220, 188, 240, 280, 260, 320, 280, 340, 380, 410, 380, 440, 412, 380, 462, 420, 488, 510, 482, 520, 542,
              ]}
              labels={["May 4", "8", "12", "16", "20", "24"].map((d, i) => (i % 4 === 0 ? d : ""))}
              height={200}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11.5px]">
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[var(--color-ink-4)]">Deposits</div>
              <div className="tabular text-[13px] font-semibold text-[var(--color-ink)]">$8.40M</div>
            </div>
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[var(--color-ink-4)]">Withdrawals</div>
              <div className="tabular text-[13px] font-semibold text-[var(--color-ink)]">$3.24M</div>
            </div>
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[var(--color-ink-4)]">Net deposit</div>
              <div className="tabular text-[13px] font-semibold text-[var(--color-success)]">+$5.16M</div>
            </div>
          </div>
        </Card>

        <Card padding="p-5">
          <CardHeader title="Revenue formula · live" description="As applied for May 2026" />
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3.5 mb-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
              Volume share formula
            </div>
            <div className="mono mt-1 text-[12px] text-[var(--color-ink)]">
              ($ per lot × eligible lots) − adjustments
            </div>
            <ul className="mt-2 list-disc pl-4 text-[11.5px] text-[var(--color-ink-3)]">
              <li>Eligible instruments: FX majors, metals, indices, crypto</li>
              <li>Excluded: trades held &lt; 60 seconds, scalping detected by FPG</li>
              <li>Cut-off: last trading day of the month (UTC)</li>
              <li>Settlement: net 15 days, USD wire</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {[
              ["Gross lots", "21_488"],
              ["Eligible lots", "20_244"],
              ["Excluded (scalping)", "−874"],
              ["Excluded (clients)", "−370"],
              ["Effective $/lot", "$8.45"],
              ["Net payable", "$171,062"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5"
              >
                <span className="text-[var(--color-ink-4)]">{k}</span>
                <span className="tabular font-medium text-[var(--color-ink)]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-md bg-[var(--color-brand-soft)] p-3">
            <span className="text-[12.5px] font-medium text-[var(--color-brand)]">
              Provisional payable · May 2026
            </span>
            <span className="tabular text-[18px] font-semibold text-[var(--color-brand)]">$171,062</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
