"use client";

import * as React from "react";
import { I } from "./Icon";

/* -------------------------------------------------------------------------- */
/*  Toast primitives                                                           */
/* -------------------------------------------------------------------------- */

export type ToastTone = "success" | "info" | "warning" | "danger";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastInput {
  id: string;
  createdAt: number;
}

interface ToastContextValue {
  push: (t: ToastInput) => string;
  remove: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be called inside <ToastProvider>");
  return ctx;
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: string) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: ToastInput) => {
      const id = `t_${++toastId}`;
      const item: ToastItem = {
        ...t,
        id,
        createdAt: Date.now(),
        tone: t.tone ?? "info",
        durationMs: t.durationMs ?? 4200,
      };
      setItems((arr) => [...arr, item]);
      window.setTimeout(() => remove(id), item.durationMs);
      return id;
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <ToastViewport items={items} remove={remove} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  items,
  remove,
}: {
  items: ToastItem[];
  remove: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tone = item.tone ?? "info";
  const accent =
    tone === "success"
      ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
      : tone === "warning"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : tone === "danger"
          ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
          : "bg-[var(--color-info-soft)] text-[var(--color-info)]";
  const Icon =
    tone === "success"
      ? I.CircleCheck
      : tone === "warning"
        ? I.AlertTriangle
        : tone === "danger"
          ? I.CircleX
          : I.Info;
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-md border border-[var(--color-line)] bg-white p-3 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.18)] animate-in"
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${accent}`}>
        <Icon size={12} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-[var(--color-ink)]">{item.title}</div>
        {item.description && (
          <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-ink-3)]">
            {item.description}
          </div>
        )}
        {item.action && (
          <button
            className="mt-1.5 text-[11.5px] font-medium text-[var(--color-brand-2)] hover:underline"
            onClick={() => {
              item.action!.onClick();
              onClose();
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="ml-1 text-[var(--color-ink-4)] hover:text-[var(--color-ink)]"
        aria-label="Dismiss"
      >
        <I.X size={12} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirm modal                                                              */
/* -------------------------------------------------------------------------- */

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  // optional input to capture (e.g. rejection reason)
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (result: { confirmed: boolean; value?: string }) => void;
}

const ConfirmContext = React.createContext<{
  ask: (opts: ConfirmOptions) => Promise<{ confirmed: boolean; value?: string }>;
} | null>(null);

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be called inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>({
    open: false,
    title: "",
  });
  const [inputVal, setInputVal] = React.useState("");

  const ask = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<{ confirmed: boolean; value?: string }>((resolve) => {
      setInputVal("");
      setState({ ...opts, open: true, resolve });
    });
  }, []);

  function close(confirmed: boolean) {
    state.resolve?.({ confirmed, value: confirmed ? inputVal : undefined });
    setState((s) => ({ ...s, open: false, resolve: undefined }));
  }

  return (
    <ConfirmContext.Provider value={{ ask }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          <div className="relative z-10 w-full max-w-[420px] rounded-md border border-[var(--color-line)] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.32)]">
            <h3 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
              {state.title}
            </h3>
            {state.description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
                {state.description}
              </p>
            )}
            {state.inputLabel !== undefined && (
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-[11.5px] font-medium text-[var(--color-ink-2)]">
                  {state.inputLabel}
                </span>
                <textarea
                  autoFocus
                  rows={3}
                  className="input !h-auto !min-h-[72px] !py-2 text-[12.5px]"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={state.inputPlaceholder}
                />
              </label>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="btn-ghost" onClick={() => close(false)}>
                {state.cancelLabel ?? "Cancel"}
              </button>
              <button
                className={state.tone === "danger" ? "btn-danger" : "btn-primary"}
                onClick={() => {
                  if (state.inputRequired && inputVal.trim().length === 0) return;
                  close(true);
                }}
                disabled={state.inputRequired && inputVal.trim().length === 0}
              >
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Convenience hook: run an async action with toast feedback                  */
/* -------------------------------------------------------------------------- */

export function useAction() {
  const { push } = useToast();
  return React.useCallback(
    async <T,>(
      fn: () => Promise<T>,
      opts: {
        loading?: string;
        success: string;
        successDescription?: string;
        failure?: string;
      }
    ) => {
      try {
        const r = await fn();
        push({
          title: opts.success,
          description: opts.successDescription,
          tone: "success",
        });
        return r;
      } catch (e) {
        push({
          title: opts.failure ?? "Something went wrong",
          description: e instanceof Error ? e.message : undefined,
          tone: "danger",
        });
        throw e;
      }
    },
    [push]
  );
}
