import * as React from "react";

/**
 * APEX brand assets.
 *
 * The official wordmark + symbol is shipped as `/public/apex-logo.svg`
 * (the navy variant matching our brand, #020859).
 *
 * Three exports:
 *   <ApexMark>     — just the symbol (icon)
 *   <ApexWordmark> — symbol + "APEX" text + optional suffix
 *   <ApexLogo>     — the full SVG wordmark from the brand pack
 */

type MarkProps = {
  size?: number;
  className?: string;
  variant?: "dark" | "light";
};

/** Just the symbol part. Inline SVG so we can recolour with a variant. */
export function ApexMark({ size = 22, className, variant = "dark" }: MarkProps) {
  const fill = variant === "light" ? "#ffffff" : "#020859";
  const tint = variant === "light" ? "rgba(255,255,255,0.14)" : "#E4EDFA";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 41 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M11.2959 4.9636L1.34787 22.1301C-2.48219 28.7408 2.30679 37 9.9613 37H29.8574C37.5175 37 42.3009 28.7408 38.4708 22.1301L28.5228 4.95801C24.6927 -1.65267 15.1204 -1.65267 11.2959 4.95801V4.9636Z"
        fill={tint}
      />
      <path
        d="M8.23973 24.8962C2.30118 25.388 4.25266 31.0208 9.03042 29.7914C16.0737 27.9753 19.3934 22.7504 17.47 15.9218C18.6252 23.1919 14.1334 24.4101 8.23973 24.9018V24.8962Z"
        fill={fill}
      />
      <path
        d="M14.1334 6.33827C9.19865 13.8151 15.9447 21.5546 12.5689 23.4489C15.8045 22.5045 18.227 20.4537 17.2121 15.1954C16.6793 12.446 16.3877 10.1773 17.5653 6.91384C19.528 1.48224 25.9208 3.561 24.0759 8.88084C23.1955 11.4122 21.3898 14.0107 23.1226 14.8433C25.3881 15.933 27.0536 11.9319 26.3526 8.26615C25.1469 1.9684 17.756 0.856371 14.1334 6.33827Z"
        fill={fill}
      />
      <path
        d="M22.8814 9.61287C25.4217 4.24274 19.5505 3.11395 18.2327 7.84704C16.2868 14.8321 19.1691 20.314 26.0666 22.0687C19.1691 19.4311 20.358 14.9439 22.8758 9.61846L22.8814 9.61287Z"
        fill={fill}
      />
      <path
        d="M21.973 14.0722C21.1767 17.3356 21.7487 20.4537 26.8237 22.2028C29.4817 23.1192 31.5958 24.0022 33.8445 26.6509C37.5848 31.0599 32.5828 35.5359 28.8817 31.289C27.1209 29.2661 25.7694 26.405 24.1768 27.4835C22.0964 28.8917 24.7432 32.3284 28.2817 33.5578C34.3604 35.6645 39.0204 29.8417 36.0651 23.9798C32.0332 15.9833 21.9337 17.9335 21.9786 14.0777L21.973 14.0722Z"
        fill={fill}
      />
      <path
        d="M16.427 26.4162C22.1636 21.7837 25.4778 25.0527 28.8424 29.892C32.2351 34.7704 36.1549 30.272 32.7005 26.7627C27.6031 21.5937 21.401 21.3366 16.427 26.4162Z"
        fill={fill}
      />
      <path
        d="M15.9279 26.9974C13.8026 28.8302 11.9801 30.2161 8.55376 30.8308C2.85073 31.8534 1.46002 25.2986 7.00604 24.2313C9.64727 23.7227 12.81 23.9854 12.6698 22.0743C12.4848 19.5764 8.17244 20.1408 5.34055 22.5772C0.467463 26.7682 3.19841 33.703 9.77624 34.083C18.743 34.6027 22.0964 24.9074 25.4273 26.8744C22.988 24.5554 19.9935 23.488 15.9335 26.9974H15.9279Z"
        fill={fill}
      />
    </svg>
  );
}

/** Symbol + uppercase "APEX" text + optional eyebrow text. */
export function ApexWordmark({
  className,
  suffix,
  variant = "dark",
  size = 22,
}: {
  className?: string;
  suffix?: string;
  variant?: "dark" | "light";
  size?: number;
}) {
  const labelColor = variant === "light" ? "text-white" : "text-[var(--color-ink)]";
  const eyebrowColor =
    variant === "light" ? "text-white/55" : "text-[var(--color-ink-4)]";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <ApexMark size={size} variant={variant} />
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className={`text-[15px] font-semibold tracking-[-0.01em] ${labelColor}`}>APEX</span>
        {suffix && (
          <span className={`text-[10px] font-medium uppercase tracking-[0.14em] ${eyebrowColor}`}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/** Full SVG wordmark from the brand pack — used on marketing panels. */
export function ApexLogo({
  className,
  height = 28,
  variant = "dark",
}: {
  className?: string;
  height?: number;
  variant?: "dark" | "light";
}) {
  const filter =
    variant === "light" ? "brightness(0) invert(1)" : undefined;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/apex-logo.svg"
      alt="APEX"
      height={height}
      style={{ height, width: "auto", filter }}
      className={className}
    />
  );
}

/** "powered by FPG" tag for footers. */
export function PoweredByFPG({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const muted = variant === "light" ? "text-white/55" : "text-[var(--color-ink-4)]";
  const strong = variant === "light" ? "text-white/80" : "text-[var(--color-ink-3)]";
  const dot = variant === "light" ? "bg-white/40" : "bg-[var(--color-ink-5)]";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] ${muted} ${className ?? ""}`}>
      <span className={`inline-block h-1 w-1 rounded-full ${dot}`} />
      powered by <span className={`font-semibold tracking-tight ${strong}`}>FPG</span>
      <span className={muted}>·</span>
      <span>Fortune Prime Global</span>
    </span>
  );
}
