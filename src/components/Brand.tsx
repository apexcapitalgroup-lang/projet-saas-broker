import * as React from "react";

type MarkProps = {
  size?: number;
  className?: string;
};

// APEX triskelion-inspired mark: three rotational segments converging on a
// central node. Tight, geometric, financial.
export function ApexMark({ size = 22, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="apex-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#06093A" />
          <stop offset="0.55" stopColor="#1730E4" />
          <stop offset="1" stopColor="#4F6CCB" />
        </linearGradient>
      </defs>
      {/* triskelion: three arms 120deg apart */}
      <g transform="translate(16 16)">
        <g>
          <path
            d="M0,-12 A12,12 0 0,1 10.39,6 L6.5,3.75 A7.5,7.5 0 0,0 0,-7.5 Z"
            fill="url(#apex-grad)"
          />
          <path
            d="M10.39,6 A12,12 0 0,1 -10.39,6 L-6.5,3.75 A7.5,7.5 0 0,0 6.5,3.75 Z"
            fill="url(#apex-grad)"
            opacity="0.82"
          />
          <path
            d="M-10.39,6 A12,12 0 0,1 0,-12 L0,-7.5 A7.5,7.5 0 0,0 -6.5,3.75 Z"
            fill="url(#apex-grad)"
            opacity="0.62"
          />
        </g>
        <circle r="2.4" fill="#fff" />
        <circle r="1.2" fill="#06093A" />
      </g>
    </svg>
  );
}

export function ApexWordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <ApexMark size={22} />
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">APEX</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">Console</span>
      </div>
    </div>
  );
}

// "powered by FPG" lockup used in footers / login footer
export function PoweredByFPG({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] text-[var(--color-ink-4)] ${className ?? ""}`}>
      <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-ink-5)]" />
      powered by <span className="font-semibold tracking-tight text-[var(--color-ink-3)]">FPG</span>
      <span className="text-[var(--color-ink-5)]">·</span>
      <span>Fortune Prime Global</span>
    </span>
  );
}
