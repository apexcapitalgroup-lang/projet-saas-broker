import { I } from "@/components/Icon";
import { Avatar, Card, CardHeader, Kpi, Pill, SectionHeader } from "@/components/ui";
import { AUDIT_LOG, fmtDate } from "@/lib/mock";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Audit log"
        description="Immutable, append-only event log of every action — human, service account or FPG webhook."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary">
              <I.Download size={14} />
              Export (signed)
            </button>
            <button className="btn-secondary">
              <I.Calendar size={14} />
              Last 24h
              <I.ChevronDown size={12} className="text-[var(--color-ink-4)]" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Events (24h)" value="2,412" delta="+18%" deltaTone="success" />
        <Kpi label="Human actions" value="184" hint="11 operators active" />
        <Kpi label="Service accounts" value="1,902" hint="API keys × scopes" />
        <Kpi label="Failed access" value="2" delta="−4" deltaTone="success" />
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div className="flex items-center gap-1">
            <Tab label="All" count={2412} active />
            <Tab label="Actions" count={184} />
            <Tab label="Webhooks" count={1842} />
            <Tab label="API calls" count={386} />
            <Tab label="Failures" count={2} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 text-[12px]">
              <I.Search size={12} className="text-[var(--color-ink-4)]" />
              <input
                placeholder="Actor, action, target or IP"
                className="w-[240px] bg-transparent outline-none placeholder:text-[var(--color-ink-4)]"
              />
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {AUDIT_LOG.map((l) => (
              <tr key={l.id}>
                <td className="text-[var(--color-ink-3)]">{fmtDate(l.at, { time: true })}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {l.actor.startsWith("API key") || l.actor === "FPG webhook" || l.actor === "Unknown" ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]">
                        {l.actor === "FPG webhook" ? (
                          <I.Webhook size={11} />
                        ) : l.actor === "Unknown" ? (
                          <I.AlertTriangle size={11} />
                        ) : (
                          <I.Key size={11} />
                        )}
                      </span>
                    ) : (
                      <Avatar name={l.actor} size={24} />
                    )}
                    <div className="flex flex-col leading-tight">
                      <span className="text-[12px] font-medium text-[var(--color-ink)]">{l.actor}</span>
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">{l.actorRole}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="mono text-[11.5px] text-[var(--color-ink-2)]">{l.action}</span>
                </td>
                <td className="text-[12px] text-[var(--color-ink-3)]">
                  {l.target ?? <span className="text-[var(--color-ink-5)]">—</span>}
                </td>
                <td className="mono">{l.ip}</td>
                <td>
                  <Pill tone={l.result === "success" ? "success" : "danger"}>
                    {l.result === "success" ? "Success" : "Failure"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card padding="p-5">
        <CardHeader title="Integrity & retention" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-[12.5px]">
          <Stat label="Storage" value="WORM (write once, read many)" sub="Append-only · signed hash chain" />
          <Stat label="Retention" value="7 years" sub="Per regulatory requirement" />
          <Stat label="Hash verification" value="Daily · last run 03:00 UTC" sub="0 integrity issues" />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-[var(--color-ink)]">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[var(--color-ink-3)]">{sub}</div>}
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
