import { I } from "@/components/Icon";
import { BarChart, Card, CardHeader, Kpi, Pill, SectionHeader, StatusPill } from "@/components/ui";
import { WEBHOOKS, fmtDate, fmtNumber } from "@/lib/mock";

const EVENT_CATEGORIES = [
  ["KYC", ["kyc_submitted", "kyc_approved", "kyc_rejected", "kyc_resubmit_required", "document_missing", "compliance_hold"]],
  ["Client", ["client_created", "client_updated", "client_suspended", "client_closed"]],
  ["Trading account", ["trading_account_created", "trading_account_updated", "leverage_changed", "password_reset_requested"]],
  ["Deposit", ["deposit_created", "deposit_pending", "deposit_completed", "deposit_failed", "deposit_chargeback", "deposit_refund"]],
  ["Withdrawal", ["withdrawal_requested", "withdrawal_under_review", "withdrawal_approved", "withdrawal_processing", "withdrawal_completed", "withdrawal_rejected"]],
  ["Trading", ["trade_closed", "daily_volume_ready", "volume_report_ready", "account_status_changed"]],
  ["Commission", ["commission_generated", "commission_adjusted", "commission_paid", "monthly_statement_ready"]],
  ["Technical", ["api_error", "webhook_retry", "reconciliation_report_ready", "incident_opened", "incident_resolved"]],
] as const;

export default function WebhooksPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Webhooks & API"
        description="Signed events from FPG · pull fallback enabled · idempotency-key enforced"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <I.Download size={14} />
              Export log
            </button>
            <button className="btn-secondary">
              <I.Sliders size={14} />
              Endpoints
            </button>
            <button className="btn-primary">
              <I.Refresh size={14} />
              Force replay
            </button>
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Delivered (24h)" value={fmtNumber(1842)} delta="+8.4%" deltaTone="success" hint="Median 102 ms" />
        <Kpi label="Retry queue" value="4" delta="2 backlogged" deltaTone="neutral" />
        <Kpi label="Dropped" value="0" delta="0 last 7 days" deltaTone="success" />
        <Kpi label="Signature verification" value="100.0%" delta="All HMAC-SHA256" deltaTone="success" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Throughput */}
        <Card className="lg:col-span-2" padding="p-5">
          <CardHeader
            title="Throughput · last 24h"
            description="Events per hour, all types"
            actions={
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-3)]">
                  <span className="h-2 w-3 rounded bg-[var(--color-brand-2)]" />
                  Delivered
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-3)]">
                  <span className="h-2 w-3 rounded bg-[var(--color-warning)]" />
                  Retry
                </span>
              </div>
            }
          />
          <BarChart
            data={[120, 88, 96, 142, 158, 174, 188, 162, 198, 224, 218, 246, 232, 244, 238, 268, 282, 254, 296, 312, 288, 268, 244, 218]}
            labels={Array.from({ length: 24 }, (_, i) => (i % 4 === 0 ? `${i}h` : ""))}
            height={200}
          />
        </Card>

        {/* Latency */}
        <Card padding="p-5">
          <CardHeader title="Latency distribution" description="HTTP response time" />
          <div className="flex flex-col gap-3">
            {[
              ["p50", "82 ms", 22],
              ["p95", "211 ms", 56],
              ["p99", "412 ms", 74],
              ["max", "812 ms", 90],
            ].map(([k, v, w]) => (
              <div key={k as string}>
                <div className="flex justify-between text-[11.5px]">
                  <span className="text-[var(--color-ink-4)]">{k as string}</span>
                  <span className="tabular font-medium text-[var(--color-ink)]">{v as string}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-brand-2)]"
                    style={{ width: `${w as number}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[11.5px] text-[var(--color-ink-3)]">
            <div className="flex items-center gap-1.5 text-[var(--color-brand)] font-medium">
              <I.Shield size={12} />
              SLA target
            </div>
            <p className="mt-1">FPG → APEX: p95 &lt; 500 ms (FPG 99.9% uptime)</p>
          </div>
        </Card>
      </div>

      {/* Event log */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All" count={1842} active />
            <Tab label="Delivered" count={1838} />
            <Tab label="Retry" count={4} />
            <Tab label="Dropped" count={0} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px]">
              <I.Search size={12} className="text-[var(--color-ink-4)]" />
              <input
                placeholder="Event type or client id"
                className="w-[200px] bg-transparent outline-none placeholder:text-[var(--color-ink-4)]"
              />
            </div>
            <FilterButton label="Type" value="All" />
            <FilterButton label="Endpoint" value="/webhooks/fpg" />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Event ID</th>
              <th>Type</th>
              <th>Payload</th>
              <th>Client</th>
              <th>Signature</th>
              <th>Attempts</th>
              <th className="text-right">Duration</th>
              <th>Status</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {WEBHOOKS.map((w) => (
              <tr key={w.id}>
                <td className="text-[var(--color-ink-3)]">{fmtDate(w.receivedAt, { time: true })}</td>
                <td>
                  <span className="mono text-[10.5px]">{w.eventId}</span>
                </td>
                <td>
                  <span className="mono text-[11.5px] text-[var(--color-ink)]">{w.type}</span>
                </td>
                <td className="max-w-[260px] truncate text-[11.5px] text-[var(--color-ink-3)] mono">
                  {w.payload}
                </td>
                <td>
                  <span className="mono text-[11.5px]">
                    {w.clientApexId ?? <span className="text-[var(--color-ink-5)]">—</span>}
                  </span>
                </td>
                <td>
                  <span className="mono text-[10.5px] text-[var(--color-success)]">{w.signature}</span>
                </td>
                <td className="tabular text-center">{w.attempts}</td>
                <td className="text-right tabular text-[var(--color-ink-3)]">{w.durationMs} ms</td>
                <td>
                  <StatusPill status={w.status} />
                </td>
                <td className="text-right">
                  <button className="btn-ghost">
                    <I.Refresh size={12} />
                    Replay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Subscribed events */}
      <Card padding="p-5">
        <CardHeader
          title="Subscribed event types"
          description="The full FPG → APEX catalogue · 36 distinct events"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {EVENT_CATEGORIES.map(([cat, events]) => (
            <div key={cat} className="flex flex-col">
              <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                {cat}
                <span className="rounded bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--color-ink-3)]">
                  {events.length}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {events.map((e) => (
                  <li
                    key={e}
                    className="flex items-center justify-between rounded-md border border-[var(--color-line-subtle)] bg-[var(--color-bg-subtle)] px-2 py-1.5"
                  >
                    <span className="mono truncate text-[11px] text-[var(--color-ink-2)]">{e}</span>
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
