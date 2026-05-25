"use client";

import * as React from "react";
import { I } from "./Icon";
import { useToast } from "./Toast";

export function SecretField({
  defaultValue,
  className = "",
}: {
  defaultValue: string;
  className?: string;
}) {
  const { push } = useToast();
  const [reveal, setReveal] = React.useState(false);
  const [val] = React.useState(defaultValue);

  async function copy() {
    try {
      await navigator.clipboard.writeText(val);
      push({ title: "Copied to clipboard", tone: "success" });
    } catch {
      push({ title: "Copy failed", tone: "danger" });
    }
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        className="input mono flex-1"
        type={reveal ? "text" : "password"}
        value={val}
        readOnly
      />
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setReveal((v) => !v)}
        title={reveal ? "Hide" : "Reveal"}
      >
        <I.Eye size={14} />
      </button>
      <button type="button" className="btn-secondary" onClick={copy} title="Copy">
        <I.Copy size={14} />
      </button>
    </div>
  );
}
