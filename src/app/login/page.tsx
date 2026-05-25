"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApexLogo, ApexMark, PoweredByFPG } from "@/components/Brand";
import { I } from "@/components/Icon";
import { Field, SecureChip } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"credentials" | "twofa">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  async function nextStep(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin/login", {
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
      setStep("twofa");
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch {
      setError("Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCode(idx: number, value: string) {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    setCode((arr) => {
      const next = [...arr];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin/twofa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.join("") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid 2FA code");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error, try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-[var(--color-bg)]">
      {/* Left: brand panel */}
      <div className="relative hidden lg:flex flex-col overflow-hidden bg-[var(--color-ink)] text-white">
        {/* subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* blurred orbs */}
        <div
          className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle at center, rgba(23,48,228,0.5), rgba(23,48,228,0) 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle at center, rgba(79,108,203,0.5), rgba(79,108,203,0) 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative flex flex-col flex-1 px-14 py-12">
          {/* top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ApexLogo height={28} variant="light" />
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/55 border-l border-white/15 pl-3">
                Operations Console
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
          </div>

          {/* mid: pitch */}
          <div className="my-auto max-w-[480px]">
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
              <span className="h-px w-6 bg-white/25" />
              Internal · Restricted
            </p>
            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em]">
              APEX powered by FPG.
              <br />
              <span className="text-white/65">The operations layer for a regulated broker partner.</span>
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/65">
              Onboard clients, review KYC, monitor MT4/MT5 accounts and reconcile payments with
              Fortune Prime Global — without ever touching client funds.
            </p>

            {/* feature stamps */}
            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 text-[12.5px]">
              {[
                ["Funds never transit APEX", "Hosted payments via FPG / PSP"],
                ["SOC 2 · ISO 27001 path", "End-to-end TLS, signed webhooks"],
                ["Granular API scopes", "Audit-grade event log"],
                ["MT4/MT5 mapped 1:1", "FPG client ID kept in sync"],
              ].map(([title, sub], i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <I.Check size={11} strokeWidth={2.4} className="text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white/90">{title}</div>
                    <div className="text-white/55">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between text-[11.5px] text-white/55">
            <span>© 2026 APEX · All rights reserved</span>
            <span className="inline-flex items-center gap-1.5">
              <I.Lock size={12} />
              TLS 1.3 · HSTS · CSP enforced
            </span>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col">
        {/* topbar (mobile only) */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <ApexMark size={22} />
            <span className="text-[14px] font-semibold tracking-tight">APEX Console</span>
          </div>
          <PoweredByFPG />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[400px]">
            {/* Step indicator */}
            <div className="mb-8 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">
              <span className={step === "credentials" ? "text-[var(--color-ink)]" : ""}>
                1 · Credentials
              </span>
              <span className="text-[var(--color-ink-5)]">/</span>
              <span className={step === "twofa" ? "text-[var(--color-ink)]" : ""}>
                2 · Two-factor
              </span>
            </div>

            {step === "credentials" ? (
              <>
                <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                  Sign in to APEX Console
                </h2>
                <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">
                  Use your APEX corporate credentials. TOTP required.
                </p>

                <form onSubmit={nextStep} className="mt-7 flex flex-col gap-4">
                  <Field label="Work email">
                    <input
                      className="input"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ariane.m@apex-ops.com"
                      required
                    />
                  </Field>
                  <Field
                    label="Password"
                    hint="Demo: ApexDemo!2026"
                  >
                    <div className="relative">
                      <input
                        className="input pr-9"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
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

                  <button type="submit" className="btn-primary mt-1 h-10 w-full" disabled={loading}>
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifying…
                      </span>
                    ) : (
                      <>Continue</>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[12px] text-[var(--color-ink-3)]">
                    <Link href="#" className="hover:text-[var(--color-ink)]">
                      Forgot password
                    </Link>
                    <Link href="#" className="inline-flex items-center gap-1 hover:text-[var(--color-ink)]">
                      <I.Key size={12} />
                      Use security key
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
                  Two-factor authentication
                </h2>
                <p className="mt-1.5 text-[13px] text-[var(--color-ink-3)]">
                  Enter the 6-digit code from your authenticator app. The code rotates every 30 seconds.
                </p>

                <form onSubmit={submitCode} className="mt-7 flex flex-col gap-4">
                  <div className="flex justify-between gap-2">
                    {code.map((v, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputsRef.current[i] = el;
                        }}
                        className="input h-12 w-12 text-center text-lg font-semibold tabular-nums"
                        inputMode="numeric"
                        maxLength={1}
                        value={v}
                        onChange={(e) => handleCode(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !v && i > 0) inputsRef.current[i - 1]?.focus();
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[var(--color-ink-3)]">
                    <span className="inline-flex items-center gap-1.5">
                      <I.Clock size={12} />
                      Expires in 23s
                    </span>
                    <button type="button" className="hover:text-[var(--color-ink)]" onClick={() => setStep("credentials")}>
                      Use a different account
                    </button>
                  </div>

                  <button type="submit" className="btn-primary mt-2 h-10 w-full" disabled={loading || code.some((c) => !c)}>
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Authenticating…
                      </span>
                    ) : (
                      <>Verify & sign in</>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Security panel */}
            <div className="mt-10 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                  <I.Shield size={12} />
                  Session security
                </span>
                <SecureChip tone="brand">Hardened</SecureChip>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-[var(--color-ink-3)]">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-ink-4)]">Origin IP</dt>
                  <dd className="mono">82.66.41.14</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-ink-4)]">Device</dt>
                  <dd>macOS · Safari</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-ink-4)]">Session TTL</dt>
                  <dd>45 min sliding</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-ink-4)]">Last sign-in</dt>
                  <dd>Yesterday · 19:42</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex items-center justify-between text-[11.5px] text-[var(--color-ink-4)]">
              <PoweredByFPG />
              <span className="hidden sm:inline">v1.0 · build 26.05.25</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
