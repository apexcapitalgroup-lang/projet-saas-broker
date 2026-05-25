import * as React from "react";
import { I } from "./Icon";

/* -------------------------------------------------------------------------- */
/*  Status pill                                                                */
/* -------------------------------------------------------------------------- */

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export function Pill({
  tone = "neutral",
  children,
  dot = true,
  className = "",
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={`pill pill-${tone} ${className}`}>
      {dot && <span className="pill-dot" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status mapping (KYC, deposits, withdrawals…)                               */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<string, StatusTone> = {
  // KYC
  approved: "success",
  passed: "success",
  pending: "warning",
  pending_kyc: "warning",
  under_review: "info",
  resubmit_required: "warning",
  document_missing: "warning",
  rejected: "danger",
  failed: "danger",
  compliance_hold: "danger",
  enhanced_due_diligence: "info",
  // deposits / withdrawals
  completed: "success",
  paid: "success",
  processing: "info",
  initiated: "neutral",
  refunded: "neutral",
  chargeback: "danger",
  // accounts
  active: "success",
  inactive: "neutral",
  suspended: "danger",
  closed: "neutral",
  restricted: "warning",
  draft: "neutral",
  // webhooks
  delivered: "success",
  retry: "warning",
  dropped: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  resubmit_required: "Resubmit required",
  document_missing: "Document missing",
  under_review: "Under review",
  compliance_hold: "Compliance hold",
  enhanced_due_diligence: "EDD",
  pending_kyc: "Pending KYC",
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = STATUS_LABEL[status] ?? status.replace(/_/g, " ");
  return (
    <Pill tone={tone}>
      <span className="capitalize">{label}</span>
    </Pill>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                     */
/* -------------------------------------------------------------------------- */

const AVATAR_PALETTE = [
  ["#E5EDF7", "#06093A"],
  ["#FCF1E0", "#B3691A"],
  ["#E6F5ED", "#0A8A4E"],
  ["#FBE9E7", "#C0322B"],
  ["#EEEAFE", "#5B4CFF"],
  ["#DCF1F0", "#0FA5A0"],
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function Avatar({
  name,
  size = 28,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const [bg, fg] = colorFor(name);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.floor(size * 0.4),
      }}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sparkline                                                                  */
/* -------------------------------------------------------------------------- */

export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = "#1730E4",
  fill = "rgba(23, 48, 228, 0.08)",
  showArea = true,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showArea?: boolean;
  strokeWidth?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / Math.max(1, data.length - 1);
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {showArea && <path d={area} fill={fill} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bar chart (basic, SVG)                                                     */
/* -------------------------------------------------------------------------- */

export function BarChart({
  data,
  labels,
  height = 200,
  className = "",
}: {
  data: number[];
  labels?: string[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className={`flex items-end gap-2 ${className}`} style={{ height }}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 24);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center" style={{ height: height - 24 }}>
              <div
                className="w-full max-w-[28px] rounded-t-[3px] bg-[var(--color-brand-2)]"
                style={{ height: `${h}px`, opacity: 0.85 }}
              />
            </div>
            {labels && (
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-4)]">
                {labels[i]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Area chart (smooth, SVG)                                                   */
/* -------------------------------------------------------------------------- */

export function AreaChart({
  data,
  series2,
  height = 220,
  className = "",
}: {
  data: number[];
  series2?: number[];
  height?: number;
  className?: string;
}) {
  const width = 720;
  const min = Math.min(...data, ...(series2 ?? []));
  const max = Math.max(...data, ...(series2 ?? []), 1);
  const range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);

  const toPath = (arr: number[]) => {
    return arr
      .map((v, i) => {
        const x = i * stepX;
        const y = height - 24 - ((v - min) / range) * (height - 48);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  };

  const linePath = toPath(data);
  const areaPath = `${linePath} L${width},${height - 24} L0,${height - 24} Z`;

  // grid lines (4 horizontal)
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((p) => 12 + p * (height - 48));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1730E4" stopOpacity="0.16" />
          <stop offset="1" stopColor="#1730E4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="area-fill-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4F6CCB" stopOpacity="0.10" />
          <stop offset="1" stopColor="#4F6CCB" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridY.map((y, i) => (
        <line key={i} x1={0} x2={width} y1={y} y2={y} stroke="#eef1f6" strokeWidth={1} />
      ))}

      {series2 && (
        <>
          <path d={`${toPath(series2)} L${width},${height - 24} L0,${height - 24} Z`} fill="url(#area-fill-2)" />
          <path d={toPath(series2)} fill="none" stroke="#4F6CCB" strokeWidth={1.5} strokeDasharray="4 4" />
        </>
      )}

      <path d={areaPath} fill="url(#area-fill)" />
      <path d={linePath} fill="none" stroke="#1730E4" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  KPI card                                                                   */
/* -------------------------------------------------------------------------- */

export function Kpi({
  label,
  value,
  delta,
  deltaTone = "success",
  hint,
  spark,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaTone?: "success" | "danger" | "neutral";
  hint?: string;
  spark?: number[];
}) {
  const deltaColor =
    deltaTone === "success"
      ? "text-[var(--color-success)]"
      : deltaTone === "danger"
        ? "text-[var(--color-danger)]"
        : "text-[var(--color-ink-3)]";
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
          {label}
        </span>
        {delta && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${deltaColor}`}>
            {deltaTone === "success" ? (
              <I.TrendingUp size={12} />
            ) : deltaTone === "danger" ? (
              <I.TrendingDown size={12} />
            ) : null}
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="tabular text-2xl font-semibold leading-none tracking-tight text-[var(--color-ink)]">
          {value}
        </div>
        {spark && (
          <Sparkline
            data={spark}
            width={96}
            height={28}
            stroke={deltaTone === "danger" ? "#C0322B" : "#1730E4"}
            fill={deltaTone === "danger" ? "rgba(192, 50, 43, 0.08)" : "rgba(23, 48, 228, 0.08)"}
          />
        )}
      </div>
      {hint && <div className="text-[11px] text-[var(--color-ink-4)]">{hint}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section header                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] leading-5 text-[var(--color-ink-3)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card primitives                                                            */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = "",
  padding = "p-4",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return <div className={`card ${padding} ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 border-b border-[var(--color-line-subtle)] pb-3">
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h3>
        {description && <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field, label                                                               */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-[var(--color-ink-2)]">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-[var(--color-ink-4)]">{hint}</span>}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Security stamp / lock chip                                                 */
/* -------------------------------------------------------------------------- */

export function SecureChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "success";
}) {
  const map = {
    neutral: "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]",
    brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
    success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10.5px] font-medium ${map[tone]}`}>
      <I.Lock size={11} strokeWidth={2} />
      {children}
    </span>
  );
}
