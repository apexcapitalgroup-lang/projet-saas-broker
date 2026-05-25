import Link from "next/link";
import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Avatar, Card, Kpi, SectionHeader, StatusPill } from "@/components/ui";
import { CLIENTS, fmtDate, fmtMoney, fmtNumber } from "@/lib/mock";

export default function ClientsPage() {
  const approved = CLIENTS.filter((c) => c.status === "approved").length;
  const pending = CLIENTS.filter((c) => c.status === "pending_kyc").length;
  const suspended = CLIENTS.filter((c) => c.status === "suspended").length;
  const corporate = CLIENTS.filter((c) => c.type === "Corporate").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Clients"
        description={
          <span>
            All clients onboarded through APEX, mirrored on FPG. Mapping APEX ID ↔ FPG ID is enforced
            at the platform level.
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="Export CSV"
              icon="Download"
              variant="secondary"
              download={{
                filename: "apex-clients-2026-05.csv",
                content:
                  "apex_id,fpg_id,name,email,country,type,status,kyc\nAPX-100482,FPG-7740921,Sebastian Lindqvist,s.lindqvist@northforest.io,Sweden,Retail,approved,approved\n",
              }}
              toastTitle="Client export ready"
              toastDescription="382 clients exported to CSV"
            />
            <ActionButton
              label="Invite client"
              icon="Plus"
              variant="primary"
              href="/portal-signup"
              newTab
              toastTitle="Signup link opened"
              toastDescription="Share /portal-signup with the prospect"
            />
          </div>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total clients" value={fmtNumber(382)} delta="+12.4%" deltaTone="success" hint="Last 30 days" />
        <Kpi label="Approved (live)" value={fmtNumber(approved * 30 + 282)} delta="+8.1%" deltaTone="success" />
        <Kpi label="Pending KYC" value={fmtNumber(pending * 8 + 24)} delta="−3" deltaTone="success" hint="Cleared today" />
        <Kpi
          label="Suspended"
          value={fmtNumber(suspended * 2 + 6)}
          delta="+1"
          deltaTone="danger"
          hint="Compliance hold"
        />
      </div>

      {/* Toolbar */}
      <Card padding="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line-subtle)] p-3">
          <div className="flex flex-1 min-w-[240px] max-w-[420px] items-center gap-2 rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5">
            <I.Search size={14} className="text-[var(--color-ink-4)]" />
            <input
              className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--color-ink-4)]"
              placeholder="Search by name, email, APX or FPG id…"
            />
            <span className="kbd">/</span>
          </div>
          <FilterButton label="Status" value="All" />
          <FilterButton label="KYC" value="All" />
          <FilterButton label="Type" value="All" />
          <FilterButton label="Country" value="All" />
          <FilterButton label="IB code" value="All" />
          <button className="btn-ghost ml-auto">
            <I.Sliders size={14} />
            Columns
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th className="w-9">
                <input type="checkbox" className="h-3.5 w-3.5 rounded" />
              </th>
              <th>Client</th>
              <th>Identifiers</th>
              <th>Type</th>
              <th>Status</th>
              <th>KYC</th>
              <th>IB</th>
              <th className="text-right">Volume 30d</th>
              <th className="text-right">Net deposit</th>
              <th>Last activity</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr key={c.id}>
                <td>
                  <input type="checkbox" className="h-3.5 w-3.5 rounded" />
                </td>
                <td>
                  <Link href={`/clients/${c.apexId}`} className="flex items-center gap-3">
                    <Avatar name={c.name} size={32} />
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)]">
                        {c.name}
                      </span>
                      <span className="text-[11px] text-[var(--color-ink-4)]">{c.email}</span>
                    </div>
                  </Link>
                </td>
                <td>
                  <div className="flex flex-col gap-0.5 text-[11px]">
                    <span className="mono">{c.apexId}</span>
                    <span className="mono text-[var(--color-ink-4)]">
                      {c.fpgId || <span className="italic">FPG: awaiting</span>}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--color-ink-2)] ${
                      c.type === "Corporate" ? "" : ""
                    }`}
                  >
                    {c.type === "Corporate" ? (
                      <I.Building size={12} className="text-[var(--color-ink-4)]" />
                    ) : (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-5)]" />
                    )}
                    {c.type}
                  </span>
                </td>
                <td>
                  <StatusPill status={c.status} />
                </td>
                <td>
                  <StatusPill status={c.kyc} />
                </td>
                <td>
                  <span className="mono">{c.ibCode}</span>
                </td>
                <td className="text-right tabular font-medium">
                  {c.volume30d > 0 ? fmtMoney(c.volume30d, "USD", { compact: true }) : "—"}
                </td>
                <td className="text-right tabular font-medium">
                  {c.netDeposit > 0 ? fmtMoney(c.netDeposit, "USD") : "—"}
                </td>
                <td className="text-[var(--color-ink-3)]">{fmtDate(c.lastActivity, { rel: true })}</td>
                <td>
                  <button className="flex h-7 w-7 items-center justify-center rounded text-[var(--color-ink-4)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-ink)]">
                    <I.MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--color-line-subtle)] px-4 py-3 text-[12px] text-[var(--color-ink-3)]">
          <span>
            Showing <span className="font-medium text-[var(--color-ink)]">1–{CLIENTS.length}</span> of{" "}
            <span className="font-medium text-[var(--color-ink)]">382</span> clients
          </span>
          <div className="flex items-center gap-1">
            <button className="btn-ghost">Previous</button>
            <button className="flex h-8 w-8 items-center justify-center rounded bg-[var(--color-brand-soft)] text-[12px] font-semibold text-[var(--color-brand)]">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded text-[12px] hover:bg-[var(--color-bg-muted)]">
              2
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded text-[12px] hover:bg-[var(--color-bg-muted)]">
              3
            </button>
            <span className="px-2 text-[var(--color-ink-4)]">…</span>
            <button className="flex h-8 w-8 items-center justify-center rounded text-[12px] hover:bg-[var(--color-bg-muted)]">
              32
            </button>
            <button className="btn-ghost">Next</button>
          </div>
        </div>
      </Card>
    </div>
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
