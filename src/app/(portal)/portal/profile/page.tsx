import { I } from "@/components/Icon";
import { Card, CardHeader, Field, Pill, SecureChip, SectionHeader } from "@/components/ui";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Profile & Security"
        description="Personal information, password, two-factor authentication and active sessions."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-0.5 self-start">
          {(
            [
              ["Personal information", "Users", true],
              ["Login & Password", "Lock", false],
              ["Two-factor", "Shield", false],
              ["Sessions & devices", "Globe", false],
              ["Email & alerts", "Mail", false],
              ["Tax information", "Document", false],
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
          {/* Personal */}
          <Card padding="p-5">
            <CardHeader
              title="Personal information"
              description="Changes require re-verification by FPG"
              actions={<button className="btn-primary">Save</button>}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="First name">
                <input className="input" defaultValue="Sebastian" />
              </Field>
              <Field label="Last name">
                <input className="input" defaultValue="Lindqvist" />
              </Field>
              <Field label="Email">
                <input className="input" defaultValue="s.lindqvist@northforest.io" />
              </Field>
              <Field label="Phone">
                <input className="input" defaultValue="+46 70 123 45 67" />
              </Field>
              <Field label="Date of birth" hint="Locked · contact support to change">
                <input className="input" defaultValue="1989-04-12" readOnly />
              </Field>
              <Field label="Nationality" hint="Locked · contact support to change">
                <input className="input" defaultValue="Sweden" readOnly />
              </Field>
            </div>
          </Card>

          {/* Security */}
          <Card padding="p-5">
            <CardHeader
              title="Security"
              description="Two-factor authentication is required for live accounts"
            />
            <ul className="flex flex-col gap-3">
              <SecurityRow
                title="Password"
                description="Last changed 12 April 2026"
                tone="success"
                action="Change"
              />
              <SecurityRow
                title="Two-factor authentication"
                description="Authenticator app · Google Authenticator"
                tone="success"
                badge="Enforced"
                action="Manage"
              />
              <SecurityRow
                title="Backup codes"
                description="8 of 10 unused · last generated 12 April 2026"
                tone="neutral"
                action="View"
              />
              <SecurityRow
                title="Security key (FIDO2)"
                description="Not configured — recommended for high-value accounts"
                tone="warning"
                action="Add"
              />
              <SecurityRow
                title="Login alerts"
                description="Email and push notifications on every new sign-in"
                tone="success"
                action="Configure"
              />
            </ul>
          </Card>

          {/* Sessions */}
          <Card padding="p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
              <div>
                <h3 className="text-[13.5px] font-semibold">Active sessions</h3>
                <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
                  Sign out everywhere if you suspect any compromise
                </p>
              </div>
              <button className="btn-secondary !text-[var(--color-danger)]">Sign out everywhere</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP</th>
                  <th>Location</th>
                  <th>Last activity</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["macOS · Safari 17", "82.66.41.14", "Paris, FR", "Now", true],
                  ["iOS · APEX app", "82.66.41.14", "Paris, FR", "1h ago", false],
                  ["Windows · Chrome 132", "82.66.41.21", "Paris, FR", "2 days ago", false],
                ].map(([d, ip, loc, last, current], i) => (
                  <tr key={i}>
                    <td className="flex items-center gap-2 font-medium">
                      {d as string}
                      {current && <Pill tone="brand">This device</Pill>}
                    </td>
                    <td className="mono">{ip as string}</td>
                    <td className="text-[var(--color-ink-3)]">{loc as string}</td>
                    <td className="text-[var(--color-ink-3)]">{last as string}</td>
                    <td className="text-right">
                      <button className="btn-ghost text-[var(--color-danger)]">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Account manager */}
          <Card padding="p-5">
            <CardHeader title="Your account manager at APEX" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-semibold">
                AM
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold">Ariane Martin</div>
                <div className="text-[12px] text-[var(--color-ink-3)]">
                  ariane.m@apex.com · +33 1 84 88 32 91
                </div>
                <div className="mt-1 text-[11.5px] text-[var(--color-ink-4)]">
                  Available Mon-Fri · 09:00–18:00 CET
                </div>
              </div>
              <button className="btn-primary">
                <I.Mail size={14} />
                Send a message
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SecurityRow({
  title,
  description,
  tone,
  badge,
  action,
}: {
  title: string;
  description: string;
  tone: "success" | "warning" | "neutral";
  badge?: string;
  action: string;
}) {
  const Icon =
    tone === "success" ? I.CircleCheck : tone === "warning" ? I.AlertTriangle : I.Info;
  const color =
    tone === "success"
      ? "text-[var(--color-success)] bg-[var(--color-success-soft)]"
      : tone === "warning"
        ? "text-[var(--color-warning)] bg-[var(--color-warning-soft)]"
        : "text-[var(--color-ink-3)] bg-[var(--color-bg-muted)]";
  return (
    <li className="flex items-start gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${color}`}>
        <Icon size={14} />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--color-ink)]">{title}</span>
          {badge && <Pill tone="success">{badge}</Pill>}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">{description}</div>
      </div>
      <button className="btn-secondary !h-8 !text-[12px]">{action}</button>
    </li>
  );
}
