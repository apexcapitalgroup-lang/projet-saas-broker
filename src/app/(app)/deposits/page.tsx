import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Avatar, Card, Kpi, SectionHeader, StatusPill } from "@/components/ui";
import { DEPOSITS, fmtDate, fmtMoney } from "@/lib/mock";

export default function DepositsPage() {
  const completed = DEPOSITS.filter((d) => d.status === "completed");
  const total = completed.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Deposits"
        description={
          <span>
            Deposits are initiated from APEX and executed by{" "}
            <span className="text-[var(--color-ink-2)] font-medium">FPG / PSP</span>. No funds ever
            transit APEX.
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="Export ledger"
              icon="Download"
              variant="secondary"
              download={{
                filename: "apex-deposits-2026-05.csv",
                content:
                  "id,fpg_txn_id,client_apex_id,amount,currency,method,status,created_at\ndp_01,FPG-DEP-A8412,APX-100482,25000,USD,Visa / Mastercard,completed,2026-05-25T07:12:00Z\n",
              }}
              toastTitle="Deposit ledger exported"
              toastDescription="3,184 deposits exported · May 2026"
            />
            <ActionButton
              label="May 2026"
              icon="Calendar"
              variant="secondary"
              toastTitle="Period selector"
              toastDescription="Use the dashboard date range to change scope."
            />
          </div>
        }
      />

      {/* Banner */}
      <div className="flex items-start gap-3 rounded-md border border-[var(--color-brand-soft)] bg-[var(--color-brand-tint)] p-3.5">
        <I.Lock size={14} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
        <div className="text-[12.5px] text-[var(--color-ink-2)]">
          <span className="font-semibold text-[var(--color-brand)]">Funds segregation.</span> All
          deposit sessions are hosted by FPG. APEX only stores the correlation ID, status and
          metadata returned via signed webhook. Card data never reaches APEX.
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Deposits (May)" value={fmtMoney(8_400_000, "USD", { compact: true })} delta="+22.4%" deltaTone="success" />
        <Kpi label="Avg deposit" value={fmtMoney(48_200, "USD")} delta="+4.1%" deltaTone="success" />
        <Kpi label="Success rate" value="96.8%" delta="+1.2 pts" deltaTone="success" />
        <Kpi label="Chargebacks (May)" value="2" delta="−4" deltaTone="success" />
      </div>

      {/* Channels */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Bank transfer", "FPG-Bank-Rails", 64.2, fmtMoney(5_392_800, "USD"), "var(--color-brand-2)"],
          ["Card · Visa / MC", "Apex-PSP-FPG", 21.4, fmtMoney(1_798_000, "USD"), "var(--color-brand-3)"],
          ["USDT", "FPG-Crypto-Gateway", 11.2, fmtMoney(940_800, "USD"), "var(--color-accent-purple)"],
          ["E-wallet", "Apex-PSP-FPG", 3.2, fmtMoney(268_800, "USD"), "var(--color-accent-teal)"],
        ].map(([method, psp, pct, amt, color]) => (
          <Card key={method as string} padding="p-4">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                  {method as string}
                </div>
                <div className="mt-0.5 text-[10.5px] text-[var(--color-ink-4)]">via {psp as string}</div>
              </div>
              <span className="tabular text-[12px] font-semibold text-[var(--color-ink-2)]">
                {(pct as number).toFixed(1)}%
              </span>
            </div>
            <div className="tabular text-[16px] font-semibold text-[var(--color-ink)]">
              {amt as string}
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct as number}%`, background: color as string }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All" count={DEPOSITS.length * 24} active />
            <Tab label="Completed" count={completed.length * 24} />
            <Tab label="Pending" count={3} />
            <Tab label="Failed" count={2} />
            <Tab label="Chargeback" count={0} />
          </div>
          <FilterButton label="Method" value="All" />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Client</th>
              <th>Account</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Fees</th>
              <th>PSP</th>
              <th>FPG txn</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEPOSITS.map((d) => (
              <tr key={d.id}>
                <td className="text-[var(--color-ink-3)]">{fmtDate(d.createdAt, { time: true })}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar name={d.clientName} size={24} />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[12px] font-medium text-[var(--color-ink)]">{d.clientName}</span>
                      <span className="mono text-[10.5px]">{d.clientApexId}</span>
                    </div>
                  </div>
                </td>
                <td className="mono text-[11.5px]">{d.account}</td>
                <td className="text-[var(--color-ink-3)]">{d.method}</td>
                <td className="text-right tabular font-medium">{fmtMoney(d.amount, d.currency)}</td>
                <td className="text-right tabular text-[var(--color-ink-4)]">
                  {d.fees > 0 ? fmtMoney(d.fees, d.currency) : "—"}
                </td>
                <td>
                  <span className="mono text-[11px]">{d.psp}</span>
                </td>
                <td>
                  <span className="mono text-[11px]">{d.fpgTxnId}</span>
                  <div className="mono text-[10.5px] text-[var(--color-ink-4)]">{d.apexCorrelationId}</div>
                </td>
                <td>
                  <StatusPill status={d.status} />
                </td>
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
        active ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]" : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
      }`}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={`inline-flex h-[18px] items-center rounded px-1.5 text-[10px] font-semibold ${
            active ? "bg-white/60 text-[var(--color-brand)]" : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
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
