import { I } from "@/components/Icon";
import { Avatar, Card, CardHeader, Kpi, SectionHeader, StatusPill } from "@/components/ui";
import { WITHDRAWALS, fmtDate, fmtMoney } from "@/lib/mock";
import { WithdrawalsHeaderActions, WithdrawalRowAction } from "./WithdrawalActions";

export default function WithdrawalsPage() {
  const pending = WITHDRAWALS.filter((w) =>
    ["requested", "under_review", "processing", "approved"].includes(w.status)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Withdrawals"
        description={
          <span>
            Initiated by clients on APEX · AML controls, approval and execution by{" "}
            <span className="text-[var(--color-ink-2)] font-medium">FPG compliance</span>.
          </span>
        }
        actions={<WithdrawalsHeaderActions />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Awaiting approval"
          value={`${pending.length * 2 + 3}`}
          delta="oldest 2h 14m"
          deltaTone="neutral"
        />
        <Kpi
          label="Withdrawals (May)"
          value={fmtMoney(3_240_000, "USD", { compact: true })}
          delta="+11.4%"
          deltaTone="success"
        />
        <Kpi label="Avg processing" value="6h 22m" delta="−42m" deltaTone="success" />
        <Kpi label="Rejection rate" value="3.1%" delta="+0.4 pts" deltaTone="danger" hint="AML primary cause" />
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All" count={WITHDRAWALS.length * 18} active />
            <Tab label="Under review" count={1} />
            <Tab label="Approved" count={2} />
            <Tab label="Processing" count={1} />
            <Tab label="Completed" count={1} />
            <Tab label="Rejected" count={1} />
          </div>
          <FilterButton label="Currency" value="All" />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Client</th>
              <th>Account</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th>Reason / note</th>
              <th>FPG txn</th>
              <th className="w-28"></th>
            </tr>
          </thead>
          <tbody>
            {WITHDRAWALS.map((w) => (
              <tr key={w.id}>
                <td className="text-[var(--color-ink-3)]">{fmtDate(w.createdAt, { time: true })}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar name={w.clientName} size={24} />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[12px] font-medium">{w.clientName}</span>
                      <span className="mono text-[10.5px]">{w.clientApexId}</span>
                    </div>
                  </div>
                </td>
                <td className="mono text-[11.5px]">{w.account}</td>
                <td className="text-[var(--color-ink-3)]">{w.method}</td>
                <td className="text-right tabular font-medium">{fmtMoney(w.amount, w.currency)}</td>
                <td>
                  <StatusPill status={w.status} />
                </td>
                <td className="max-w-[260px] truncate text-[12px] text-[var(--color-ink-3)]">
                  {w.reason ?? <span className="text-[var(--color-ink-5)]">—</span>}
                </td>
                <td>
                  <span className="mono text-[11px]">
                    {w.fpgTxnId ?? <span className="text-[var(--color-ink-5)]">awaiting</span>}
                  </span>
                  <div className="mono text-[10.5px] text-[var(--color-ink-4)]">{w.apexCorrelationId}</div>
                </td>
                <td className="text-right">
                  <WithdrawalRowAction
                    withdrawalId={w.id}
                    status={w.status}
                    clientName={w.clientName}
                    amount={w.amount}
                    currency={w.currency}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* AML guidance */}
      <Card padding="p-5">
        <CardHeader title="AML guidance" description="Operational reminders for the desk" />
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 text-[12.5px] text-[var(--color-ink-2)]">
          <li className="flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
            <I.Shield size={14} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
            <span>
              <span className="font-semibold">Source-of-funds check.</span> Withdrawals above $50,000
              require renewed SoF documentation when the previous one is older than 12 months.
            </span>
          </li>
          <li className="flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
            <I.Shield size={14} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
            <span>
              <span className="font-semibold">Payment-method consistency.</span> Withdrawals must
              return to the original deposit method up to the deposited amount.
            </span>
          </li>
          <li className="flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
            <I.Shield size={14} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
            <span>
              <span className="font-semibold">Trading activity.</span> Verify a minimum 1 round-turn
              per $1,000 deposited before processing crypto/eWallet withdrawals.
            </span>
          </li>
          <li className="flex items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
            <I.Shield size={14} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
            <span>
              <span className="font-semibold">Sanctioned countries.</span> Always re-check FPG
              sanctions API before approval.
            </span>
          </li>
        </ul>
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
