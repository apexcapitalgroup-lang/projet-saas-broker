"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { I } from "./Icon";
import { useToast } from "./Toast";

type IconKey = keyof typeof I;

export interface ActionButtonProps {
  label: string;
  icon?: IconKey;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  toastTitle?: string;
  toastDescription?: string;
  toastTone?: "success" | "info" | "warning" | "danger";
  download?: { filename: string; content: string; mime?: string };
  href?: string;
  newTab?: boolean;
  refresh?: boolean;
  size?: "default" | "sm";
  onClick?: () => void;
  className?: string;
}

/**
 * Universal action button. Use this anywhere you have a CTA whose purpose is
 * to (a) show a toast, (b) trigger a CSV/PDF download, (c) navigate, or
 * (d) refresh the page. Wires all four cases in one place so adding a button
 * is one line in the parent.
 */
export function ActionButton({
  label,
  icon,
  variant = "secondary",
  toastTitle,
  toastDescription,
  toastTone = "success",
  download,
  href,
  newTab,
  refresh,
  size = "default",
  onClick,
  className,
}: ActionButtonProps) {
  const { push } = useToast();
  const router = useRouter();
  const Icon = icon ? I[icon] : null;
  const [busy, setBusy] = React.useState(false);

  async function fire() {
    setBusy(true);
    try {
      if (download) {
        const blob = new Blob([download.content], {
          type: download.mime ?? "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = download.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      if (href) {
        if (newTab) window.open(href, "_blank", "noopener,noreferrer");
        else router.push(href as `/${string}`);
      }
      if (refresh) router.refresh();
      onClick?.();
      if (toastTitle) {
        push({
          title: toastTitle,
          description: toastDescription,
          tone: toastTone,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const base =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "danger"
          ? "btn-danger"
          : "btn-secondary";
  const sizeClass = size === "sm" ? "!h-8 !text-[12px]" : "";

  return (
    <button
      type="button"
      className={`${base} ${sizeClass} ${className ?? ""}`}
      onClick={fire}
      disabled={busy}
    >
      {busy ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 12 : 14} />
      ) : null}
      {label}
    </button>
  );
}
