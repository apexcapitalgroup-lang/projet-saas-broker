import { I } from "@/components/Icon";
import { ActionButton } from "@/components/ActionButton";
import { SecretField } from "@/components/SecretField";
import { Avatar, Card, CardHeader, Field, Pill, SectionHeader, StatusPill } from "@/components/ui";
import { TEAM, fmtDate } from "@/lib/mock";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Settings"
        description="Workspace configuration, team & roles, FPG integration parameters, notifications."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        {/* Vertical menu */}
        <nav className="flex flex-col gap-0.5 self-start">
          {(
            [
              ["Workspace", "Building", true],
              ["Team & roles", "Users", false],
              ["FPG integration", "Webhook", false],
              ["Notifications", "Bell", false],
              ["Branding", "Eye", false],
              ["Billing", "Wallet", false],
              ["Danger zone", "AlertTriangle", false],
            ] as const
          ).map(([label, icon, active]) => {
            const Icon = I[icon];
            return (
              <button
                key={label}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] ${
                  active
                    ? "bg-[var(--color-brand-soft)] font-semibold text-[var(--color-brand)]"
                    : "text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3">
          {/* Workspace */}
          <Card padding="p-5">
            <CardHeader
              title="Workspace"
              description="High-level identity and contact information shared with FPG"
              actions={
                <ActionButton
                  label="Save changes"
                  variant="primary"
                  toastTitle="Workspace updated"
                  toastDescription="New values pushed to FPG via /api/admin/settings."
                />
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Workspace name">
                <input className="input" defaultValue="APEX Production" />
              </Field>
              <Field label="Region">
                <input className="input" defaultValue="EU West (Paris)" />
              </Field>
              <Field label="Operations email">
                <input className="input" defaultValue="ops@apex-ops.com" />
              </Field>
              <Field label="Compliance email">
                <input className="input" defaultValue="compliance@apex-ops.com" />
              </Field>
              <Field label="IB code (FPG)">
                <input className="input mono" defaultValue="APEX-IB-01" />
              </Field>
              <Field label="Account manager (FPG)">
                <input className="input" defaultValue="Mei Wong · mei.wong@fpg.com" />
              </Field>
            </div>
          </Card>

          {/* Team */}
          <Card padding="p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
              <div>
                <h3 className="text-[13px] font-semibold tracking-tight">Team & roles</h3>
                <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                  6 active members · SCIM provisioning enabled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ActionButton
                  label="Role matrix"
                  icon="Sliders"
                  variant="secondary"
                  toastTitle="Role matrix"
                  toastDescription="6 roles · 36 permissions · documented in /docs/security-EN.md."
                />
                <ActionButton
                  label="Invite member"
                  icon="Plus"
                  variant="primary"
                  toastTitle="Invitation flow"
                  toastDescription="SCIM provisioning via your IdP — link in clipboard."
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>2FA</th>
                  <th>Last seen</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} size={28} />
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-[var(--color-ink)]">{m.name}</span>
                          <span className="text-[11px] text-[var(--color-ink-4)]">{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Pill tone={m.role === "Admin" ? "brand" : "neutral"} dot={false}>
                        {m.role}
                      </Pill>
                    </td>
                    <td>
                      <StatusPill status={m.status} />
                    </td>
                    <td>
                      {m.twoFA ? (
                        <span className="inline-flex items-center gap-1 text-[var(--color-success)] text-[11.5px]">
                          <I.CircleCheck size={12} /> Enforced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--color-warning)] text-[11.5px]">
                          <I.AlertTriangle size={12} /> Not set
                        </span>
                      )}
                    </td>
                    <td className="text-[var(--color-ink-3)]">
                      {m.lastSeen === "—" ? "—" : fmtDate(m.lastSeen, { rel: true })}
                    </td>
                    <td className="text-right">
                      <ActionButton
                        label=""
                        icon="MoreHorizontal"
                        variant="ghost"
                        toastTitle={`Actions for ${m.name}`}
                        toastDescription="Edit role, reset password, or suspend access."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* FPG integration */}
          <Card padding="p-5">
            <CardHeader
              title="FPG integration"
              description="API base URLs, webhook secret rotation, environment switching"
              actions={
                <Pill tone="success" className="!h-6">
                  <I.Lock size={11} />
                  Verified
                </Pill>
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Environment" hint="Switching environments triggers a full webhook resync">
                <div className="flex gap-1 rounded-md border border-[var(--color-line)] bg-white p-0.5">
                  <button className="flex-1 rounded bg-[var(--color-brand-soft)] py-1.5 text-[12px] font-semibold text-[var(--color-brand)]">
                    Production
                  </button>
                  <button className="flex-1 rounded py-1.5 text-[12px] font-medium text-[var(--color-ink-3)] hover:bg-[var(--color-bg-muted)]">
                    Sandbox
                  </button>
                </div>
              </Field>
              <Field label="API base URL">
                <input className="input mono" defaultValue="https://api.fortuneprime.com/v1/" readOnly />
              </Field>
              <Field label="Webhook endpoint (APEX)">
                <input
                  className="input mono"
                  defaultValue="https://api.apex-ops.com/v1/webhooks/fpg"
                  readOnly
                />
              </Field>
              <Field label="Webhook signing secret" hint="Rotated automatically every 90 days">
                <SecretField defaultValue="whsec_E9b3a2c7d4f1g8h6j5k0" />
              </Field>
              <Field label="Webhook retry policy">
                <input
                  className="input mono"
                  defaultValue="exponential · max 5 attempts · 30s → 8h"
                  readOnly
                />
              </Field>
              <Field label="Idempotency-key TTL">
                <input className="input mono" defaultValue="24 hours" readOnly />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Metric label="Sandbox connectivity" tone="success" value="Reachable · 88 ms" />
              <Metric label="Production connectivity" tone="success" value="Reachable · 82 ms" />
              <Metric label="Last sync" tone="neutral" value="42 seconds ago" />
            </div>
          </Card>

          {/* Notifications */}
          <Card padding="p-5">
            <CardHeader
              title="Notifications"
              description="Channel routing per event category"
            />
            <table className="data-table -mt-1">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Email</th>
                  <th>Slack #ops</th>
                  <th>PagerDuty</th>
                  <th>SMS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["KYC pending > 1h SLA", true, true, false, false],
                  ["Withdrawal awaiting approval", true, true, false, false],
                  ["Reconciliation delta", true, true, true, true],
                  ["Webhook retry > 3 attempts", true, true, true, false],
                  ["API rate limit > 80%", true, true, false, false],
                  ["Security event", true, true, true, true],
                ].map(([label, ...channels], i) => (
                  <tr key={i}>
                    <td className="font-medium">{label as string}</td>
                    {channels.map((on, j) => (
                      <td key={j}>
                        {on ? (
                          <I.CircleCheck size={14} className="text-[var(--color-success)]" />
                        ) : (
                          <span className="inline-block h-3 w-3 rounded-full border border-[var(--color-line-strong)]" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
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
      <div className={`mt-1 text-[13px] font-semibold ${color}`}>{value}</div>
    </div>
  );
}
