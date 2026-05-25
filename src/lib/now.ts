// Deterministic "now" for the demo. All time-relative formatting anchors here.
// In production this would be `Date.now()`; we freeze it so the demo data
// reads consistently across sessions.
const FROZEN = process.env.NEXT_PUBLIC_NOW ?? process.env.NOW ?? "2026-05-25T09:00:00Z";

export const NOW = new Date(FROZEN);

export function nowDate(): Date {
  return new Date(NOW.getTime());
}

export function nowIso(): string {
  return NOW.toISOString();
}
