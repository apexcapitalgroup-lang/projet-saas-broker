import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Card, CardHeader, Kpi, SectionHeader, StatusPill } from "@/components/ui";
import { fmtMoney, fmtNumber } from "@/lib/mock";

const STATEMENTS = [
  { period: "May 2026", lots: 20244, gross: 184240, adj: -13178, payable: 171062, status: "pending" as const, due: "2026-06-15" },
  { period: "April 2026", lots: 18420, gross: 152800, adj: -9810, payable: 142990, status: "paid" as const, due: "2026-05-15" },
  { period: "March 2026", lots: 17110, gross: 138800, adj: -8200, payable: 130600, status: "paid" as const, due: "2026-04-15" },
  { period: "February 2026", lots: 14620, gross: 118400, adj: -7100, payable: 111300, status: "paid" as const, due: "2026-03-15" },
  { period: "January 2026", lots: 12180, gross: 98400, adj: -5800, payable: 92600, status: "paid" as const, due: "2026-02-15" },
];

const ADJUSTMENTS = [
  { date: "2026-05-23", type: "scalping", reason: "Trades < 60s on EURUSD (account FPG7740921-L1)", lots: -218, amount: -1842 },
  { date: "2026-05-18", type: "exclusion", reason: "Excluded client APX-100530 (compliance hold)", lots: -112, amount: -946 },
  { date: "2026-05-14", type: "chargeback", reason: "Deposit chargeback APX-100517 · refund pending", lots: 0, amount: -1200 },
  { date: "2026-05-08", type: "rebate", reason: "Volume threshold bonus · APEX-IB-01 ", lots: 0, amount: 3200 },
];

export default function CommissionsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Commissions"
        description="Statements and adjustments. The applied formula is shared with FPG and locked at month-end."
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="Download all statements"
              icon="Download"
              variant="secondary"
              download={{
                filename: "apex-statements-archive.zip",
                content:
                  "# Mock archive — production would deliver signed PDFs per period.\n",
              }}
              toastTitle="Statements archive ready"
              toastDescription="5 signed statements bundled"
            />
            <ActionButton
              label="Reconciliation pack"
              icon="Document"
              variant="primary"
              download={{
                filename: "apex-reconciliation-pack-2026-05.pdf",
                content: "%PDF-1.4\n% Reconciliation pack May 2026.\n",
                mime: "application/pdf",
              }}
              toastTitle="Reconciliation pack generated"
              toastDescription="Includes adjustments + per-day delta investigation."
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="MTD payable" value={fmtMoney(171062, "USD")} delta="+19.6%" deltaTone="success" />
        <Kpi label="YTD payable" value={fmtMoney(648552, "USD")} delta="vs $410k prior YTD" />
        <Kpi label="Adjustments (May)" value={fmtMoney(-13_178, "USD")} delta="−7.1% of gross" deltaTone="neutral" />
        <Kpi label="Next settlement" value="15 Jun 2026" hint="Net 15 · USD wire" />
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <h3 className="text-[13px] font-semibold">Monthly statements</h3>
          <button className="btn-ghost text-[var(--color-brand)]">
            View archive
            <I.ChevronRight size={12} />
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th className="text-right">Eligible lots</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Adjustments</th>
              <th className="text-right">Net payable</th>
              <th>Status</th>
              <th>Settlement</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {STATEMENTS.map((s) => (
              <tr key={s.period}>
                <td className="font-medium">{s.period}</td>
                <td className="text-right tabular">{fmtNumber(s.lots)}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">{fmtMoney(s.gross, "USD")}</td>
                <td className="text-right tabular text-[var(--color-danger)]">
                  {fmtMoney(s.adj, "USD")}
                </td>
                <td className="text-right tabular font-semibold text-[var(--color-ink)]">
                  {fmtMoney(s.payable, "USD")}
                </td>
                <td>
                  <StatusPill status={s.status} />
                </td>
                <td className="text-[var(--color-ink-3)]">Due {s.due}</td>
                <td className="text-right">
                  <button className="btn-ghost">
                    <I.Eye size={12} />
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold">May 2026 — adjustments</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Detailed exclusions, scalping detection, chargebacks and discretionary rebates
            </p>
          </div>
          <button className="btn-ghost text-[var(--color-brand)]">
            <I.Download size={12} />
            Export
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reason</th>
              <th className="text-right">Lots</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {ADJUSTMENTS.map((a, i) => (
              <tr key={i}>
                <td className="text-[var(--color-ink-3)]">{a.date}</td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium capitalize">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        a.type === "rebate"
                          ? "bg-[var(--color-success)]"
                          : a.type === "chargeback"
                            ? "bg-[var(--color-danger)]"
                            : "bg-[var(--color-warning)]"
                      }`}
                    />
                    {a.type}
                  </span>
                </td>
                <td className="text-[var(--color-ink-3)]">{a.reason}</td>
                <td className="text-right tabular">{a.lots !== 0 ? a.lots : "—"}</td>
                <td
                  className={`text-right tabular font-semibold ${
                    a.amount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                  }`}
                >
                  {fmtMoney(a.amount, "USD", { sign: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
