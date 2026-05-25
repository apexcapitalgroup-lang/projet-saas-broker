"use client";

import * as React from "react";

interface DropdownProps {
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
  }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

/**
 * Click-outside-aware dropdown. Children receives a `close` function to call
 * after an item is activated.
 */
export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      {trigger({
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })}
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 min-w-[200px] rounded-md border border-[var(--color-line)] bg-white p-1 shadow-[var(--shadow-popover)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  icon,
  children,
  tone = "default",
  shortcut,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "danger";
  shortcut?: string;
}) {
  const colorClass =
    tone === "danger"
      ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
      : "text-[var(--color-ink-2)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-ink)]";
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left text-[12.5px] ${colorClass}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="mono text-[10px] text-[var(--color-ink-4)]">{shortcut}</span>
      )}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--color-line-subtle)]" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-4)]">
      {children}
    </div>
  );
}
