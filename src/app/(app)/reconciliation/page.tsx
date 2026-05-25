import { I } from "@/components/Icon";
import { Card, CardHeader, Kpi, Pill, SectionHeader } from "@/components/ui";
import { RECONCILIATION, fmtDate, fmtMoney, fmtNumber } from "@/lib/mock";

export default function ReconciliationPage() {
  const deltas = RECONCILIATION.filter((r) => r.status === "delta").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Daily reconciliation"
        description="Compare APEX records against FPG canonical data. Any non-zero delta triggers an alert."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <I.Refresh size={14} />
              Re-run reconciliation
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
        <Kpi label="Last reconciliation" value="24 May 2026" hint="03:00 UTC · automated" />
        <Kpi label="7-day match rate" value="99.92%" delta="+0.04 pts" deltaTone="success" />
        <Kpi
          label="Open deltas"
          value={`${deltas}`}
          delta="−$5,620"
          deltaTone="danger"
          hint="Withdrawals · 20 May"
        />
        <Kpi label="Reports delivered" value="7 / 7" deltaTone="success" hint="Mon–Sun · 03:00 UTC" />
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold">Day-by-day match · FPG ↔ APEX</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Includes deposits, withdrawals, trading volume in lots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              Reconciled
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
              Delta
            </span>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="text-right">FPG deposits</th>
              <th className="text-right">APEX deposits</th>
              <th className="text-right">FPG withdrawals</th>
              <th className="text-right">APEX withdrawals</th>
              <th className="text-right">FPG volume (lots)</th>
              <th className="text-right">APEX volume (lots)</th>
              <th className="text-right">Delta</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {RECONCILIATION.map((r) => (
              <tr key={r.date}>
                <td className="font-medium text-[var(--color-ink)]">{fmtDate(r.date)}</td>
                <td className="text-right tabular">{fmtMoney(r.fpgDeposits, "USD")}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">
                  {fmtMoney(r.apexDeposits, "USD")}
                </td>
                <td className="text-right tabular">{fmtMoney(r.fpgWithdrawals, "USD")}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">
                  {fmtMoney(r.apexWithdrawals, "USD")}
                </td>
                <td className="text-right tabular">{fmtNumber(r.fpgVolumeLots)}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">
                  {fmtNumber(r.apexVolumeLots)}
                </td>
                <td
                  className={`text-right tabular font-semibold ${
                    r.delta === 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                  }`}
                >
                  {r.delta === 0 ? "$0" : fmtMoney(r.delta, "USD", { sign: true })}
                </td>
                <td>
                  <Pill tone={r.status === "reconciled" ? "success" : "danger"}>
                    {r.status === "reconciled" ? "Reconciled" : "Delta"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Delta investigation */}
      <Card padding="p-5">
        <CardHeader
          title="20 May 2026 — open delta investigation"
          description="−$5,620 missing on withdrawals (FPG higher than APEX)"
          actions={
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-warning)]">
              <I.AlertTriangle size={12} />
              Pending resolution
            </span>
          }
        />
        <ol className="relative ml-2 flex flex-col gap-3 border-l border-dashed border-[var(--color-line)] pl-4 text-[12.5px]">
          <li className="relative">
            <span className="absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-success-soft)] bg-[var(--color-success-soft)] text-[var(--color-success)]">
              <I.CircleCheck size={11} />
            </span>
            <span className="font-medium">FPG ledger pulled</span>
            <span className="ml-2 text-[var(--color-ink-4)]">24 May, 03:00 UTC · automated</span>
          </li>
          <li className="relative">
            <span className="absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-warning-soft)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
              <I.AlertTriangle size={11} />
            </span>
            <span className="font-medium">Delta detected · 20 May withdrawals</span>
            <span className="ml-2 text-[var(--color-ink-4)]">−$5,620 · 1 entry</span>
            <p className="mt-1 text-[var(--color-ink-3)]">
              Suspected late chargeback adjustment on a refund processed by FPG-Crypto-Gateway. APEX
              did not receive the corresponding webhook (replay scheduled).
            </p>
          </li>
          <li className="relative">
            <span className="absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-info-soft)] bg-[var(--color-info-soft)] text-[var(--color-info)]">
              <I.Refresh size={11} />
            </span>
            <span className="font-medium">Webhook replay requested from FPG</span>
            <span className="ml-2 text-[var(--color-ink-4)]">25 May, 08:30 UTC · Hannah Weber</span>
          </li>
          <li className="relative opacity-50">
            <span className="absolute -left-[26px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink-4)]">
              <I.Clock size={11} />
            </span>
            <span className="font-medium">Pending FPG response</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
