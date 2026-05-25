import Link from "next/link";
import { I } from "@/components/Icon";
import {
  Avatar,
  AreaChart,
  BarChart,
  Card,
  CardHeader,
  Kpi,
  Pill,
  SectionHeader,
  Sparkline,
  StatusPill,
} from "@/components/ui";
import {
  CLIENTS,
  DEPOSITS,
  KYC_PIPELINE,
  NET_DEPOSIT_12M,
  VOLUME_SERIES_12M,
  VOLUME_SERIES_30D,
  WEBHOOKS,
  WITHDRAWALS,
  fmtDate,
  fmtMoney,
  fmtNumber,
} from "@/lib/mock";

export default function DashboardPage() {
  const pendingKyc = CLIENTS.filter((c) => c.kyc !== "approved").length;
  const pendingWithdrawals = WITHDRAWALS.filter((w) =>
    ["requested", "under_review", "processing", "approved"].includes(w.status)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Operations overview"
        description={
          <span>
            Snapshot of APEX activity across FPG infrastructure ·{" "}
            <span className="text-[var(--color-ink-2)]">Sunday, 25 May 2026 · 09:00 UTC</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost">
              <I.Refresh size={14} />
              Refresh
            </button>
            <button className="btn-secondary">
              <I.Calendar size={14} />
              Last 30 days
              <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
            </button>
            <button className="btn-primary">
              <I.Download size={14} />
              Export
            </button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Active clients"
          value={fmtNumber(382)}
          delta="+12.4%"
          deltaTone="success"
          hint="vs previous 30 days"
          spark={[260, 272, 281, 290, 296, 308, 318, 322, 334, 342, 351, 358, 362, 370, 374, 378, 382]}
        />
        <Kpi
          label="Trading volume (30d)"
          value={`$${fmtNumber(2.18, { compact: true, suffix: "B" })}`}
          delta="+18.2%"
          deltaTone="success"
          hint="48 instruments traded"
          spark={VOLUME_SERIES_30D}
        />
        <Kpi
          label="Net deposit (30d)"
          value={fmtMoney(12_400_000, "USD", { compact: true })}
          delta="+9.1%"
          deltaTone="success"
          hint="Deposits − withdrawals"
          spark={[18, 22, 26, 24, 31, 28, 35, 33, 41, 39, 48, 52, 56, 58, 62, 64, 71, 69, 78, 82, 80]}
        />
        <Kpi
          label="Revenue share (May)"
          value={fmtMoney(184_240, "USD")}
          delta="+22.6%"
          deltaTone="success"
          hint="Volume-based · 65% of forecast"
          spark={[10, 12, 14, 18, 21, 26, 32, 38, 42, 48, 56, 62, 70, 78, 84, 92, 102, 118, 134, 152, 168, 184]}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Volume chart */}
        <Card className="lg:col-span-2" padding="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-semibold tracking-tight text-[var(--color-ink)]">
                Trading volume vs net deposit
              </h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                Last 12 months · USD billion
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11.5px]">
              <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-2)]">
                <span className="h-2 w-3 rounded bg-[var(--color-brand-2)]" />
                Volume
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-2)]">
                <span className="h-0.5 w-3 rounded bg-[var(--color-brand-3)]" />
                Net deposit
              </span>
            </div>
          </div>
          <AreaChart data={VOLUME_SERIES_12M} series2={NET_DEPOSIT_12M.map((v) => v * 2)} height={220} />
          <div className="mt-3 grid grid-cols-6 gap-1 text-center text-[10.5px] uppercase tracking-wider text-[var(--color-ink-4)]">
            {["Jun", "Aug", "Oct", "Dec", "Feb", "Apr"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </Card>

        {/* KYC Pipeline */}
        <Card padding="p-5">
          <CardHeader
            title="KYC pipeline"
            description="Today · across all client types"
            actions={
              <Link href="/kyc" className="btn-ghost text-[var(--color-brand)]">
                View queue
                <I.ChevronRight size={12} />
              </Link>
            }
          />
          <div className="flex flex-col gap-2.5">
            <KycRow
              tone="warning"
              label="Pending review"
              count={KYC_PIPELINE.pending}
              hint="Median wait: 2h 14m"
            />
            <KycRow
              tone="info"
              label="Under review (compliance)"
              count={KYC_PIPELINE.under_review}
            />
            <KycRow
              tone="warning"
              label="Resubmit required"
              count={KYC_PIPELINE.resubmit_required}
            />
            <KycRow
              tone="warning"
              label="Document missing"
              count={KYC_PIPELINE.document_missing}
            />
            <KycRow tone="danger" label="Compliance hold" count={KYC_PIPELINE.compliance_hold} />
            <KycRow tone="success" label="Approved today" count={KYC_PIPELINE.approved_today} />
            <KycRow tone="danger" label="Rejected today" count={KYC_PIPELINE.rejected_today} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] px-3 py-2">
            <span className="text-[11.5px] text-[var(--color-ink-3)]">
              Approval rate (rolling 7d)
            </span>
            <span className="tabular text-[13px] font-semibold text-[var(--color-success)]">94.2%</span>
          </div>
        </Card>
      </div>

      {/* Second grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2" padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
            <div>
              <h3 className="text-[13px] font-semibold tracking-tight">Recent deposits</h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                Initiated from APEX · executed by FPG / PSP
              </p>
            </div>
            <Link href="/deposits" className="btn-ghost text-[var(--color-brand)]">
              All transactions
              <I.ChevronRight size={12} />
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>FPG txn</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {DEPOSITS.slice(0, 6).map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.clientName} size={26} />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-[var(--color-ink)]">{d.clientName}</span>
                        <span className="mono text-[10.5px]">{d.clientApexId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-[var(--color-ink-3)]">{d.method}</td>
                  <td className="text-right tabular font-medium text-[var(--color-ink)]">
                    {fmtMoney(d.amount, d.currency)}
                  </td>
                  <td>
                    <StatusPill status={d.status} />
                  </td>
                  <td className="mono">{d.fpgTxnId}</td>
                  <td className="text-[var(--color-ink-3)]">{fmtDate(d.createdAt, { rel: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Webhooks health */}
        <Card padding="p-5">
          <CardHeader
            title="FPG webhook stream"
            description="Last 24 hours · signed events"
            actions={
              <Link href="/webhooks" className="btn-ghost text-[var(--color-brand)]">
                Inspect
                <I.ChevronRight size={12} />
              </Link>
            }
          />
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Delivered
              </div>
              <div className="mt-1 tabular text-[16px] font-semibold text-[var(--color-success)]">
                1,842
              </div>
            </div>
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Retry
              </div>
              <div className="mt-1 tabular text-[16px] font-semibold text-[var(--color-warning)]">
                4
              </div>
            </div>
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Dropped
              </div>
              <div className="mt-1 tabular text-[16px] font-semibold text-[var(--color-danger)]">
                0
              </div>
            </div>
          </div>

          <BarChart
            data={[120, 88, 96, 142, 158, 174, 188, 162, 198, 224, 218, 246]}
            labels={["10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"]}
            height={120}
          />

          <div className="mt-4 flex flex-col gap-1.5 border-t border-[var(--color-line-subtle)] pt-3">
            {WEBHOOKS.slice(0, 4).map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-[11.5px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    w.status === "delivered"
                      ? "bg-[var(--color-success)]"
                      : w.status === "retry"
                        ? "bg-[var(--color-warning)]"
                        : "bg-[var(--color-danger)]"
                  }`}
                />
                <span className="mono truncate text-[var(--color-ink-2)]">{w.type}</span>
                <span className="ml-auto mono text-[var(--color-ink-4)]">{w.durationMs}ms</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts + Withdrawals */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card padding="p-5">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                <I.AlertTriangle size={14} className="text-[var(--color-warning)]" />
                Operations queue
              </span>
            }
            description="Items requiring action"
          />
          <ul className="flex flex-col divide-y divide-[var(--color-line-subtle)]">
            {[
              {
                tone: "danger" as const,
                title: "1 reconciliation delta",
                detail: "20 May · −$5,620 on withdrawals (FPG vs APEX)",
                href: "/reconciliation",
              },
              {
                tone: "warning" as const,
                title: "3 withdrawals awaiting approval",
                detail: "Total $420,000 · oldest 2h 14m",
                href: "/withdrawals",
              },
              {
                tone: "warning" as const,
                title: "1 webhook retry in progress",
                detail: "evt_01HXY8K4F02 · deposit_failed · 3 attempts",
                href: "/webhooks",
              },
              {
                tone: "info" as const,
                title: "API rate limit @ 62%",
                detail: "Production · trades endpoint",
                href: "/security",
              },
            ].map((it, i) => (
              <li key={i}>
                <Link href={it.href} className="flex items-start gap-2.5 py-3 group">
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full ${
                      it.tone === "danger"
                        ? "bg-[var(--color-danger)]"
                        : it.tone === "warning"
                          ? "bg-[var(--color-warning)]"
                          : "bg-[var(--color-info)]"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium text-[var(--color-ink)] group-hover:text-[var(--color-brand)]">
                      {it.title}
                    </div>
                    <div className="text-[11.5px] text-[var(--color-ink-4)]">{it.detail}</div>
                  </div>
                  <I.ChevronRight size={12} className="mt-1 text-[var(--color-ink-5)]" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2" padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
            <div>
              <h3 className="text-[13px] font-semibold tracking-tight">Withdrawals — open queue</h3>
              <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                Approval flow handled by FPG compliance
              </p>
            </div>
            <Link href="/withdrawals" className="btn-ghost text-[var(--color-brand)]">
              Manage
              <I.ChevronRight size={12} />
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="text-right">Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {pendingWithdrawals.slice(0, 5).map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={w.clientName} size={26} />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-[var(--color-ink)]">{w.clientName}</span>
                        <span className="mono text-[10.5px]">{w.apexCorrelationId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-right tabular font-medium">{fmtMoney(w.amount, w.currency)}</td>
                  <td className="text-[var(--color-ink-3)]">{w.method}</td>
                  <td>
                    <StatusPill status={w.status} />
                  </td>
                  <td className="text-[var(--color-ink-3)]">{fmtDate(w.updatedAt, { rel: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function KycRow({
  tone,
  label,
  count,
  hint,
}: {
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[12.5px] text-[var(--color-ink-2)]">
        <Pill tone={tone} className="w-[44px] justify-center !px-1">
          <span className="tabular">{count}</span>
        </Pill>
        <span>{label}</span>
      </span>
      {hint && <span className="text-[11px] text-[var(--color-ink-4)]">{hint}</span>}
    </div>
  );
}
