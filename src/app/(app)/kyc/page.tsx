import Link from "next/link";
import { I } from "@/components/Icon";
import { Avatar, Card, CardHeader, Kpi, Pill, SectionHeader, StatusPill } from "@/components/ui";
import { CLIENTS, KYC_PIPELINE, fmtDate, fmtNumber } from "@/lib/mock";

export default function KycPage() {
  const queue = CLIENTS.filter((c) => c.kyc !== "approved");

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="KYC / KYB review queue"
        description="APEX collects documents; FPG decides. All status transitions are signed and timestamped."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost">
              <I.Refresh size={14} />
              Sync FPG
            </button>
            <button className="btn-secondary">
              <I.Sliders size={14} />
              SLA & rules
            </button>
            <button className="btn-primary">
              <I.Plus size={14} />
              Manual submission
            </button>
          </div>
        }
      />

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <PipelineCard label="Submitted today" value={KYC_PIPELINE.submitted_today} tone="neutral" />
        <PipelineCard label="Pending" value={KYC_PIPELINE.pending} tone="warning" />
        <PipelineCard label="Under review" value={KYC_PIPELINE.under_review} tone="info" />
        <PipelineCard label="Resubmit" value={KYC_PIPELINE.resubmit_required} tone="warning" />
        <PipelineCard label="Doc missing" value={KYC_PIPELINE.document_missing} tone="warning" />
        <PipelineCard label="Approved" value={KYC_PIPELINE.approved_today} tone="success" />
        <PipelineCard label="Compliance hold" value={KYC_PIPELINE.compliance_hold} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
        {/* Queue */}
        <Card padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
            <div className="flex items-center gap-1">
              <Tab label="Review queue" count={queue.length} active />
              <Tab label="Resubmissions" count={3} />
              <Tab label="Compliance hold" count={1} />
              <Tab label="Approved (today)" count={11} />
            </div>
            <div className="flex items-center gap-2">
              <FilterButton label="Tier" value="All" />
              <FilterButton label="Country" value="All" />
              <FilterButton label="Risk" value="All" />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Country</th>
                <th>Type</th>
                <th>Stage</th>
                <th>Issue</th>
                <th>Submitted</th>
                <th>SLA</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clients/${c.apexId}`} className="flex items-center gap-3">
                      <Avatar name={c.name} size={28} />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)]">
                          {c.name}
                        </span>
                        <span className="mono text-[10.5px]">{c.apexId}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="text-[var(--color-ink-2)]">{c.country}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-ink-2)]">
                      {c.type === "Corporate" ? (
                        <I.Building size={12} className="text-[var(--color-ink-4)]" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-5)]" />
                      )}
                      {c.type === "Corporate" ? "KYB" : "KYC"}
                    </span>
                  </td>
                  <td>
                    <StatusPill status={c.kyc} />
                  </td>
                  <td className="text-[12px] text-[var(--color-ink-3)]">
                    {kycIssue(c.kyc)}
                  </td>
                  <td className="text-[var(--color-ink-3)]">{fmtDate(c.registeredAt, { rel: true })}</td>
                  <td>
                    <SlaDot kyc={c.kyc} />
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost text-[var(--color-brand)]">
                      Review
                      <I.ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Sidebar: details of selected client (here: most urgent) */}
        <Card padding="p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
            <span className="text-[13px] font-semibold">Quick review</span>
            <button className="btn-ghost">
              <I.X size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar name="Damien Larue" size={36} />
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold">Damien Larue</span>
                <span className="text-[11px] text-[var(--color-ink-4)]">APX-100501 · France</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <StatusPill status="resubmit_required" />
              <Pill tone="warning">Tier 1</Pill>
            </div>

            {/* Documents */}
            <div>
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                Documents
              </div>
              <ul className="flex flex-col gap-1.5">
                <DocRow name="ID card · front" status="approved" />
                <DocRow name="ID card · back" status="approved" />
                <DocRow name="Selfie / liveness" status="approved" />
                <DocRow name="Proof of address" status="rejected" issue="Older than 3 months" />
                <DocRow name="AML questionnaire" status="approved" />
              </ul>
            </div>

            {/* Suitability */}
            <div>
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                Suitability
              </div>
              <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[12px] text-[var(--color-ink-3)]">
                <div className="flex justify-between">
                  <span>Trading experience</span>
                  <span className="font-medium text-[var(--color-ink-2)]">2-5 years</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk tolerance</span>
                  <span className="font-medium text-[var(--color-ink-2)]">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated net worth</span>
                  <span className="font-medium text-[var(--color-ink-2)]">€50k – €250k</span>
                </div>
                <div className="flex justify-between">
                  <span>Source of funds</span>
                  <span className="font-medium text-[var(--color-ink-2)]">Employment</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 border-t border-[var(--color-line-subtle)] pt-3">
              <button className="btn-primary w-full">
                <I.Check size={14} />
                Approve
              </button>
              <button className="btn-secondary w-full">
                <I.Refresh size={14} />
                Request resubmission
              </button>
              <button className="btn-secondary w-full text-[var(--color-danger)] hover:!bg-[var(--color-danger-soft)]">
                <I.X size={14} />
                Reject
              </button>
            </div>

            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-brand-tint)] p-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                Reviewer note
              </div>
              <p className="text-[12px] text-[var(--color-ink-2)]">
                FPG compliance flagged proof of address. Request a utility bill dated within the last
                90 days. Notify client via APEX template <span className="mono">kyc.resubmit.poa.v3</span>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PipelineCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const bg =
    tone === "success"
      ? "bg-[var(--color-success-soft)]"
      : tone === "warning"
        ? "bg-[var(--color-warning-soft)]"
        : tone === "danger"
          ? "bg-[var(--color-danger-soft)]"
          : tone === "info"
            ? "bg-[var(--color-info-soft)]"
            : "bg-[var(--color-bg-muted)]";
  const fg =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "warning"
        ? "text-[var(--color-warning)]"
        : tone === "danger"
          ? "text-[var(--color-danger)]"
          : tone === "info"
            ? "text-[var(--color-info)]"
            : "text-[var(--color-ink-3)]";
  return (
    <div className="card flex flex-col gap-1 p-3">
      <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </span>
      <div className="flex items-end gap-2">
        <span className="tabular text-[20px] font-semibold text-[var(--color-ink)]">{value}</span>
        <span className={`mb-1 inline-block h-2 w-2 rounded-full ${bg} ${fg}`} />
      </div>
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

function kycIssue(kyc: string) {
  switch (kyc) {
    case "resubmit_required":
      return "Proof of address rejected (older than 90 days)";
    case "document_missing":
      return "Awaiting proof of address";
    case "compliance_hold":
      return "Manual AML review · suspicious transfer pattern";
    case "under_review":
      return "Auto-checks passed · awaiting analyst";
    case "enhanced_due_diligence":
      return "Corporate · UBO chain verification";
    case "pending":
      return "Pending FPG decision";
    default:
      return "—";
  }
}

function SlaDot({ kyc }: { kyc: string }) {
  const tone =
    kyc === "compliance_hold"
      ? "danger"
      : kyc === "resubmit_required" || kyc === "document_missing"
        ? "warning"
        : "success";
  const label =
    tone === "danger" ? "Breached · 18h" : tone === "warning" ? "2h 14m left" : "On track";
  return (
    <Pill tone={tone}>
      {label}
    </Pill>
  );
}

function DocRow({
  name,
  status,
  issue,
}: {
  name: string;
  status: "approved" | "rejected" | "pending";
  issue?: string;
}) {
  const tone =
    status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";
  return (
    <li className="flex items-start justify-between gap-2 text-[12px]">
      <span className="flex items-center gap-2 text-[var(--color-ink-2)]">
        <I.Document size={12} className="text-[var(--color-ink-4)]" />
        <span>
          {name}
          {issue && <span className="block text-[10.5px] text-[var(--color-danger)]">{issue}</span>}
        </span>
      </span>
      <Pill tone={tone}>{status}</Pill>
    </li>
  );
}
