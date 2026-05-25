"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApexMark, PoweredByFPG } from "@/components/Brand";
import { I } from "@/components/Icon";
import { Field, SecureChip } from "@/components/ui";

export default function PortalLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/portal");
    } catch {
      setError("Network error, try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr] bg-[var(--color-bg)]">
      {/* Right column on desktop, but shown left — image / pitch panel */}
      <div className="relative hidden lg:flex order-2 flex-col overflow-hidden bg-[var(--color-ink)] text-white">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-40 top-1/4 h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(23,48,228,0.55), rgba(23,48,228,0) 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-20 -bottom-20 h-[420px] w-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(79,108,203,0.45), rgba(79,108,203,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative flex flex-1 flex-col px-14 py-12">
          <div className="flex items-center gap-2.5">
            <ApexMark size={26} />
            <span className="text-[17px] font-semibold tracking-[-0.01em]">APEX</span>
          </div>

          <div className="my-auto max-w-[460px]">
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
              <span className="h-px w-6 bg-white/25" /> Client portal
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em]">
              Trade with the depth of an institutional broker.
              <br />
              <span className="text-white/65">On an interface built for you.</span>
            </h1>
            <p className="mt-5 text-[14px] leading-relaxed text-white/65">
              48 markets · MT4 / MT5 · spreads from 0.0 pips. Hosted by{" "}
              <span className="font-semibold text-white">Fortune Prime Global</span>, the regulated
              broker behind APEX.
            </p>

            {/* social proof */}
            <div className="mt-9 flex items-center gap-6 text-[13px] text-white/75">
              <div>
                <div className="text-[22px] font-semibold text-white">$1.2B+</div>
                <div className="text-[11.5px] text-white/55">cleared monthly</div>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <div className="text-[22px] font-semibold text-white">12k+</div>
                <div className="text-[11.5px] text-white/55">active traders</div>
              </div>
              <div className="h-8 w-px bg-white/15" />
              <div>
                <div className="text-[22px] font-semibold text-white">99.98%</div>
                <div className="text-[11.5px] text-white/55">platform uptime</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11.5px] text-white/55">
            <span>© 2026 APEX · powered by FPG</span>
            <span className="inline-flex items-center gap-1.5">
              <I.Lock size={12} />
              Bank-grade encryption
            </span>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="order-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <ApexMark size={22} />
            <span className="text-[14px] font-semibold tracking-tight">APEX</span>
          </div>
          <PoweredByFPG />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[400px]">
            <h2 className="text-[28px] font-semibold tracking-[-0.01em]">Welcome back.</h2>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-3)]">
              Sign in to access your trading accounts, deposits and statements.
            </p>

            <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="s.lindqvist@northforest.io"
                  required
                />
              </Field>
              <Field label="Password" hint="Demo: TraderDemo!2026">
                <div className="relative">
                  <input
                    className="input pr-9"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <I.Lock
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-4)]"
                  />
                </div>
              </Field>
              {error && (
                <div className="rounded-md border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-3 py-2 text-[12px] text-[var(--color-danger)]">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-[12px]">
                <label className="inline-flex items-center gap-1.5 text-[var(--color-ink-3)]">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded" defaultChecked />
                  Remember this device
                </label>
                <Link href="#" className="text-[var(--color-brand-2)] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn-primary mt-1 h-11 w-full text-[14px]" disabled={loading}>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>

              <div className="relative my-2 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="h-px w-full bg-[var(--color-line)]" />
                </div>
                <span className="relative bg-[var(--color-bg)] px-3 text-[11px] uppercase tracking-wider text-[var(--color-ink-4)]">
                  Or
                </span>
              </div>

              <Link href="/portal-signup" className="btn-secondary h-11 w-full text-[13.5px]">
                Create an account
              </Link>
            </form>

            <div className="mt-8 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3.5">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                <I.Shield size={12} />
                Why APEX
              </div>
              <ul className="flex flex-col gap-1.5 text-[12px] text-[var(--color-ink-2)]">
                {[
                  ["MT4 / MT5 platforms", "Hosted by FPG, regulated broker"],
                  ["Funds never with APEX", "Direct PSP / bank rails"],
                  ["KYC reviewed in < 4h", "Trade as soon as approved"],
                ].map(([title, sub]) => (
                  <li key={title} className="flex items-start gap-2">
                    <I.CircleCheck size={12} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
                    <span>
                      <span className="font-medium">{title}</span>
                      <span className="ml-1 text-[var(--color-ink-4)]">· {sub}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between text-[11.5px] text-[var(--color-ink-4)]">
              <PoweredByFPG />
              <Link href="/login" className="hover:text-[var(--color-ink)]">
                Staff sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
