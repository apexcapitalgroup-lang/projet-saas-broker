import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Card, Kpi, SectionHeader, StatusPill } from "@/components/ui";
import { DEPOSITS, WITHDRAWALS, fmtDate, fmtMoney } from "@/lib/mock";

export default function TransactionsPage() {
  const myDeposits = DEPOSITS.filter((d) => d.clientApexId === "APX-100482");
  const myWithdrawals = WITHDRAWALS.filter((w) => w.clientApexId === "APX-100482");
  const tx = [
    ...myDeposits.map((d) => ({
      id: d.id,
      date: d.createdAt,
      type: "Deposit" as const,
      method: d.method,
      account: d.account,
      amount: d.amount,
      currency: d.currency,
      status: d.status,
      ref: d.fpgTxnId,
      inward: true,
    })),
    ...myWithdrawals.map((w) => ({
      id: w.id,
      date: w.createdAt,
      type: "Withdrawal" as const,
      method: w.method,
      account: w.account,
      amount: w.amount,
      currency: w.currency,
      status: w.status,
      ref: w.fpgTxnId ?? "—",
      inward: false,
    })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Transactions"
        description="Every credit and debit on your accounts · sourced from FPG ledger."
        actions={
          <ActionButton
            label="Statement (PDF)"
            icon="Download"
            variant="secondary"
            download={{
              filename: "apex-transactions-statement.pdf",
              content: "%PDF-1.4\n% APEX × FPG transaction statement.\n",
              mime: "application/pdf",
            }}
            toastTitle="Statement generated"
            toastDescription="Signed PDF · all transactions for the period"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Lifetime deposits" value={fmtMoney(124_500, "USD")} delta="+25k this month" deltaTone="success" />
        <Kpi label="Lifetime withdrawals" value={fmtMoney(8_000, "USD")} />
        <Kpi label="Net deposit" value={fmtMoney(116_500, "USD")} deltaTone="success" />
        <Kpi label="Pending" value="0" hint="No transaction in review" />
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All" count={tx.length} active />
            <Tab label="Deposits" count={myDeposits.length} />
            <Tab label="Withdrawals" count={myWithdrawals.length} />
            <Tab label="Adjustments" count={0} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px]">
              <I.Search size={12} className="text-[var(--color-ink-4)]" />
              <input
                placeholder="Reference or method"
                className="w-[200px] bg-transparent outline-none placeholder:text-[var(--color-ink-4)]"
              />
            </div>
            <ActionButton
              label="Last 90 days"
              icon="Calendar"
              variant="secondary"
              size="sm"
              toastTitle="Time range"
              toastDescription="Transactions filtered to the last 90 days."
            />
          </div>
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
              <th>FPG reference</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id}>
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
                <td className="mono text-[11px]">{t.ref}</td>
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
