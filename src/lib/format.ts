import { NOW } from "./now";

export function fmtMoney(
  value: number,
  currency: string = "USD",
  opts: { compact?: boolean; sign?: boolean } = {}
) {
  const sign = opts.sign && value > 0 ? "+" : "";
  const v = Math.abs(value);
  if (opts.compact) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 1,
      notation: "compact",
    });
    return sign + formatter.format(value);
  }
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: v >= 1000 ? 0 : 2,
  });
  return sign + formatter.format(value);
}

export function fmtNumber(
  value: number,
  opts: { compact?: boolean; suffix?: string } = {}
) {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: opts.compact ? 1 : 0,
    notation: opts.compact ? "compact" : undefined,
  });
  return formatter.format(value) + (opts.suffix ?? "");
}

export function fmtDate(
  iso: string,
  opts: { time?: boolean; rel?: boolean } = {}
) {
  if (iso === "—") return iso;
  const d = new Date(iso);
  if (opts.rel) {
    const diff = (NOW.getTime() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!opts.time) return date;
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} · ${time}`;
}

export function fmtPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}
