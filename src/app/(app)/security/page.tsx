import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { Card, CardHeader, Kpi, Pill, SecureChip, SectionHeader, StatusPill } from "@/components/ui";
import { API_KEYS, fmtDate } from "@/lib/mock";

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Security & compliance"
        description="API keys, network controls, encryption, MFA, rotation policies and certifications."
        actions={
          <div className="flex items-center gap-2">
            <ActionButton
              label="Security policy"
              icon="Document"
              variant="secondary"
              href="https://github.com/apexcapitalgroup-lang/projet-saas-broker/blob/master/docs/security-EN.md"
              newTab
              toastTitle="Security policy opened"
            />
            <ActionButton
              label="SOC 2 pack"
              icon="Download"
              variant="secondary"
              download={{
                filename: "apex-soc2-readiness.pdf",
                content:
                  "%PDF-1.4\n% APEX SOC 2 Type II readiness — engagement scheduled Q4 2026.\n",
                mime: "application/pdf",
              }}
              toastTitle="SOC 2 pack downloaded"
              toastDescription="Readiness pack — gap analysis + controls"
            />
          </div>
        }
      />

      {/* Posture overview */}
      <Card padding="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <svg width={72} height={72} viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" stroke="#eef1f6" strokeWidth="6" fill="none" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="url(#secgrad)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 30 * 0.94} ${2 * Math.PI * 30}`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                />
                <defs>
                  <linearGradient id="secgrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#06093A" />
                    <stop offset="1" stopColor="#1730E4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-[18px] font-semibold leading-none">94</span>
                <span className="text-[9px] text-[var(--color-ink-4)]">/ 100</span>
              </div>
            </div>
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Security posture · strong</h2>
              <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)]">
                4 outstanding items · last automated audit 24 May 2026
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <SecureChip tone="success">TLS 1.3 enforced</SecureChip>
                <SecureChip tone="success">HMAC-SHA256 webhooks</SecureChip>
                <SecureChip tone="success">SSO via SAML 2.0</SecureChip>
                <SecureChip tone="success">2FA · 11 / 12 users</SecureChip>
                <SecureChip tone="brand">Pen test · Q1 2026</SecureChip>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[220px]">
            <Stat label="MTTR (security)" value="42 min" tone="success" />
            <Stat label="Vulns (open)" value="0 · critical" tone="success" />
            <Stat label="Failed logins (24h)" value="2" tone="warning" />
            <Stat label="Sessions active" value="11" />
          </div>
        </div>
      </Card>

      {/* API keys */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold">API keys</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Scoped credentials with IP allow-list and automated rotation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              label="Rotate"
              icon="Refresh"
              variant="secondary"
              toastTitle="API keys rotated"
              toastDescription="2 keys rotated · old keys remain valid for 7 days"
            />
            <ActionButton
              label="New key"
              icon="Plus"
              variant="primary"
              toastTitle="New API key issued"
              toastDescription="Copy the secret now — it won't be shown again."
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Prefix</th>
              <th>Scopes</th>
              <th>IP allow-list</th>
              <th>Last used</th>
              <th>Created</th>
              <th>Status</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {API_KEYS.map((k) => (
              <tr key={k.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]">
                      <I.Key size={11} />
                    </span>
                    <span className="font-medium text-[var(--color-ink)]">{k.label}</span>
                  </div>
                </td>
                <td>
                  <span className="mono text-[11px]">
                    {k.prefix}
                    <span className="text-[var(--color-ink-4)]">••••••••</span>
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="mono rounded bg-[var(--color-brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-brand)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-0.5 mono text-[11px] text-[var(--color-ink-3)]">
                    {k.ipAllowlist.map((ip) => (
                      <span key={ip}>{ip}</span>
                    ))}
                  </div>
                </td>
                <td className="text-[var(--color-ink-3)]">{fmtDate(k.lastUsed, { rel: true })}</td>
                <td className="text-[var(--color-ink-3)]">{fmtDate(k.createdAt)}</td>
                <td>
                  <StatusPill status={k.status} />
                </td>
                <td className="text-right">
                  <button className="btn-ghost">
                    <I.MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Encryption / network / certifications */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card padding="p-5">
          <CardHeader title="Encryption" />
          <ul className="flex flex-col gap-2.5 text-[12.5px]">
            <Row icon="Lock" tone="success" label="TLS 1.3 · HSTS preload" value="External traffic" />
            <Row icon="Lock" tone="success" label="AES-256-GCM" value="Data at rest" />
            <Row icon="Lock" tone="success" label="Encrypted backups" value="Cross-region, 35-day retention" />
            <Row icon="Lock" tone="success" label="KYC document store" value="S3-compatible, signed URLs" />
            <Row icon="Key" tone="success" label="Customer-managed keys" value="AWS KMS · auto-rotated 90d" />
          </ul>
        </Card>

        <Card padding="p-5">
          <CardHeader title="Network" />
          <ul className="flex flex-col gap-2.5 text-[12.5px]">
            <Row icon="Globe" tone="success" label="WAF" value="OWASP top 10 enforced" />
            <Row icon="Globe" tone="success" label="DDoS mitigation" value="L3 / L7 · CDN-fronted" />
            <Row icon="Globe" tone="success" label="IP allow-list" value="Admin & API ingress" />
            <Row icon="Globe" tone="success" label="Egress to FPG" value="mTLS · static IP pair" />
            <Row icon="Globe" tone="warning" label="Bastion access" value="Operations · MFA + audit" />
          </ul>
        </Card>

        <Card padding="p-5">
          <CardHeader title="Certifications & posture" />
          <ul className="flex flex-col gap-2.5 text-[12.5px]">
            <CertRow name="ISO 27001" status="In progress" eta="Audit Q3 2026" />
            <CertRow name="SOC 2 Type II" status="Roadmap" eta="Engagement scheduled" />
            <CertRow name="GDPR" status="Compliant" eta="DPO appointed" />
            <CertRow name="CSPN" status="Roadmap" eta="—" />
            <CertRow name="PCI DSS" status="Not applicable" eta="No card data stored" />
          </ul>
        </Card>
      </div>

      {/* Active sessions */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold">Active sessions</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              45-minute sliding TTL · sessions automatically invalidated on IP change
            </p>
          </div>
          <ActionButton
            label="Revoke all"
            variant="secondary"
            className="!text-[var(--color-danger)]"
            toastTitle="All sessions revoked"
            toastDescription="11 sessions invalidated · everyone will be signed out."
            toastTone="warning"
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>IP</th>
              <th>Location</th>
              <th>Device</th>
              <th>Last activity</th>
              <th>Expires in</th>
              <th>2FA</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Ariane Martin", "Admin", "82.66.41.14", "Paris, FR", "macOS · Safari 17", "42s ago", "44m", true, true],
              ["Camille Roux", "Compliance Officer", "82.66.41.18", "Paris, FR", "macOS · Chrome 132", "4m ago", "41m", true, true],
              ["Hannah Weber", "Operations", "82.66.41.21", "Paris, FR", "Windows · Edge 132", "12m ago", "33m", true, true],
              ["Marc Lefevre", "Finance", "82.66.41.19", "Paris, FR", "macOS · Chrome 132", "1h ago", "Expired soon", true, true],
            ].map(([name, role, ip, loc, device, last, exp, tfa, current], i) => (
              <tr key={i}>
                <td className="flex items-center gap-2">
                  <span className="font-medium">{name as string}</span>
                  {current && i === 0 && <Pill tone="brand">You</Pill>}
                </td>
                <td className="text-[var(--color-ink-3)]">{role as string}</td>
                <td className="mono">{ip as string}</td>
                <td className="text-[var(--color-ink-3)]">{loc as string}</td>
                <td className="text-[var(--color-ink-3)]">{device as string}</td>
                <td className="text-[var(--color-ink-3)]">{last as string}</td>
                <td className="tabular">{exp as string}</td>
                <td>
                  {tfa ? (
                    <I.CircleCheck size={14} className="text-[var(--color-success)]" />
                  ) : (
                    <I.CircleX size={14} className="text-[var(--color-danger)]" />
                  )}
                </td>
                <td className="text-right">
                  <ActionButton
                    label="Revoke"
                    variant="ghost"
                    className="!text-[var(--color-danger)]"
                    toastTitle={`Session revoked`}
                    toastDescription={`${name as string} signed out from ${device as string}.`}
                    toastTone="warning"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Row({
  icon,
  tone,
  label,
  value,
}: {
  icon: keyof typeof I;
  tone: "success" | "warning" | "danger";
  label: string;
  value: string;
}) {
  const Icon = I[icon];
  const color =
    tone === "success"
      ? "text-[var(--color-success)] bg-[var(--color-success-soft)]"
      : tone === "warning"
        ? "text-[var(--color-warning)] bg-[var(--color-warning-soft)]"
        : "text-[var(--color-danger)] bg-[var(--color-danger-soft)]";
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${color}`}>
        <Icon size={11} />
      </span>
      <div className="flex flex-col">
        <span className="font-medium text-[var(--color-ink)]">{label}</span>
        <span className="text-[11.5px] text-[var(--color-ink-4)]">{value}</span>
      </div>
    </li>
  );
}

function CertRow({ name, status, eta }: { name: string; status: string; eta: string }) {
  const tone =
    status === "Compliant"
      ? "success"
      : status === "In progress"
        ? "info"
        : status === "Not applicable"
          ? "neutral"
          : "warning";
  return (
    <li className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2 last:border-b-0 last:pb-0">
      <div className="flex flex-col">
        <span className="font-medium text-[var(--color-ink)]">{name}</span>
        <span className="text-[11.5px] text-[var(--color-ink-4)]">{eta}</span>
      </div>
      <Pill tone={tone as "success" | "info" | "neutral" | "warning"}>{status}</Pill>
    </li>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-[var(--color-success)]"
      : tone === "warning"
        ? "text-[var(--color-warning)]"
        : tone === "danger"
          ? "text-[var(--color-danger)]"
          : "text-[var(--color-ink)]";
  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
        {label}
      </div>
      <div className={`tabular mt-1 text-[15px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}
