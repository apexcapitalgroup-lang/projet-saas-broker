import { I } from "@/components/Icon";
import { Card, CardHeader, Pill, SectionHeader } from "@/components/ui";

const STATEMENTS = [
  { period: "May 2026", date: "2026-06-01", size: "184 KB" },
  { period: "April 2026", date: "2026-05-01", size: "152 KB" },
  { period: "March 2026", date: "2026-04-01", size: "168 KB" },
  { period: "February 2026", date: "2026-03-01", size: "132 KB" },
  { period: "January 2026", date: "2026-02-01", size: "98 KB" },
];

const LEGAL = [
  { name: "FPG Terms & Conditions", version: "v4.2 · April 2026", accepted: "2026-04-12 09:14 UTC" },
  { name: "Risk disclosure", version: "v3.1 · January 2026", accepted: "2026-04-12 09:14 UTC" },
  { name: "Order execution policy", version: "v2.4 · March 2026", accepted: "2026-04-12 09:14 UTC" },
  { name: "Privacy notice", version: "v5.0 · May 2026", accepted: "2026-04-12 09:14 UTC" },
  { name: "Conflicts of interest policy", version: "v1.8", accepted: "2026-04-12 09:14 UTC" },
];

const KYC_DOCS = [
  { name: "Passport (front)", uploaded: "2026-04-12", status: "verified" },
  { name: "Passport (back)", uploaded: "2026-04-12", status: "verified" },
  { name: "Selfie / liveness", uploaded: "2026-04-12", status: "verified" },
  { name: "Proof of address", uploaded: "2026-04-12", status: "verified" },
  { name: "Source of funds", uploaded: "2026-04-15", status: "verified" },
];

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Documents"
        description="Statements, legal agreements and your KYC pack — kept in sync with FPG records."
      />

      {/* Monthly statements */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
          <div>
            <h3 className="text-[13.5px] font-semibold">Monthly statements</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Signed PDFs issued by Fortune Prime Global
            </p>
          </div>
          <button className="btn-secondary">
            <I.Download size={14} />
            Download all
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Issued</th>
              <th>Size</th>
              <th>Format</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {STATEMENTS.map((s) => (
              <tr key={s.period}>
                <td className="font-medium">{s.period}</td>
                <td className="text-[var(--color-ink-3)]">{s.date}</td>
                <td className="text-[var(--color-ink-3)]">{s.size}</td>
                <td>
                  <Pill tone="neutral" dot={false}>
                    PDF · signed
                  </Pill>
                </td>
                <td className="text-right">
                  <button className="btn-ghost text-[var(--color-brand)]">
                    <I.Download size={12} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legal */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card padding="p-5">
          <CardHeader title="Legal agreements" description="Issued by Fortune Prime Global · acceptance is timestamped" />
          <ul className="flex flex-col gap-2">
            {LEGAL.map((l) => (
              <li
                key={l.name}
                className="flex items-start justify-between gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3"
              >
                <div className="flex items-start gap-2.5">
                  <I.Document size={14} className="mt-0.5 text-[var(--color-ink-3)]" />
                  <div>
                    <div className="text-[12.5px] font-semibold text-[var(--color-ink)]">{l.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-4)]">{l.version}</div>
                    <div className="text-[10.5px] text-[var(--color-ink-4)]">
                      Accepted on {l.accepted}
                    </div>
                  </div>
                </div>
                <button className="btn-ghost text-[var(--color-brand)]">
                  <I.Download size={12} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="p-5">
          <CardHeader title="KYC pack" description="Documents we shared with FPG for verification" />
          <ul className="flex flex-col gap-2">
            {KYC_DOCS.map((d) => (
              <li
                key={d.name}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3"
              >
                <div className="flex items-center gap-2.5">
                  <I.Shield size={14} className="text-[var(--color-success)]" />
                  <div>
                    <div className="text-[12.5px] font-semibold text-[var(--color-ink)]">{d.name}</div>
                    <div className="text-[11px] text-[var(--color-ink-4)]">Uploaded {d.uploaded}</div>
                  </div>
                </div>
                <Pill tone="success">Verified</Pill>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[11.5px] text-[var(--color-ink-3)]">
            <div className="mb-1 inline-flex items-center gap-1.5 text-[var(--color-ink-2)] font-medium">
              <I.Lock size={11} />
              Storage
            </div>
            Documents are encrypted at rest and accessible only to FPG compliance and APEX support
            with a justified ticket. Next annual review: <span className="font-medium">2027-04-12</span>.
          </div>
        </Card>
      </div>
    </div>
  );
}
