"use client";

import * as React from "react";
import Link from "next/link";
import { ApexMark, PoweredByFPG } from "@/components/Brand";
import { I } from "@/components/Icon";
import { Pill, SecureChip } from "@/components/ui";

const PLATFORMS = [
  {
    key: "MT5",
    name: "MetaTrader 5",
    sub: "Recommended · multi-asset, depth of market, faster execution.",
    badges: ["48 markets", "Hedging", "Algo support"],
  },
  {
    key: "MT4",
    name: "MetaTrader 4",
    sub: "Classic platform, ideal for forex-focused EAs.",
    badges: ["28 markets", "EAs", "MQL4 compatible"],
  },
];

const TYPES = [
  {
    key: "Standard",
    name: "Standard",
    spread: "from 1.0 pip",
    commission: "no commission",
    min: "$100 min deposit",
    description: "All-inclusive spreads, no commission. Ideal for swing traders.",
    recommended: false,
  },
  {
    key: "Raw",
    name: "Raw",
    spread: "from 0.0 pip",
    commission: "$3.5 / lot / side",
    min: "$1,000 min deposit",
    description: "Institutional spreads with transparent per-lot commission.",
    recommended: true,
  },
  {
    key: "Pro",
    name: "Pro",
    spread: "from 0.4 pip",
    commission: "$2.0 / lot / side",
    min: "$5,000 min deposit",
    description: "Balanced spreads and commissions for active traders.",
    recommended: false,
  },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY"] as const;
const LEVERAGES = [30, 100, 200, 500] as const;

export default function OnboardingAccountPage() {
  const [platform, setPlatform] = React.useState("MT5");
  const [type, setType] = React.useState("Raw");
  const [mode, setMode] = React.useState<"Live" | "Demo">("Live");
  const [currency, setCurrency] = React.useState<typeof CURRENCIES[number]>("USD");
  const [leverage, setLeverage] = React.useState<number>(200);

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-bg)] px-6 py-3">
        <Link href="/portal" className="flex items-center gap-2.5">
          <ApexMark size={22} />
          <span className="text-[14.5px] font-semibold tracking-tight">APEX</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">
            Choose your account
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <PoweredByFPG />
          <span className="text-[12px] text-[var(--color-ink-3)]">Step 3 of 3</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Configure your account</h1>
          <p className="text-[13.5px] text-[var(--color-ink-3)]">
            Your trading account is created on Fortune Prime Global. You can open additional
            accounts later from your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            {/* Mode */}
            <section className="card p-5">
              <SectionTitle title="Account mode" subtitle="You can switch between live and demo at any time" />
              <div className="grid grid-cols-2 gap-2">
                {(["Live", "Demo"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex flex-col items-start gap-1 rounded-md border p-3 text-left ${
                      mode === m
                        ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">{m}</span>
                      {mode === m && (
                        <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />
                      )}
                    </div>
                    <span className="text-[11.5px] text-[var(--color-ink-4)]">
                      {m === "Live" ? "Real money · regulated by FPG" : "$50,000 virtual capital · no risk"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Platform */}
            <section className="card p-5">
              <SectionTitle title="Trading platform" subtitle="Your account works on both desktop and mobile" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={`flex flex-col gap-2 rounded-md border p-4 text-left ${
                      platform === p.key
                        ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-ink)] text-[10.5px] font-bold text-white">
                          {p.key}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-[var(--color-ink)]">{p.name}</div>
                          <div className="text-[11.5px] text-[var(--color-ink-4)]">{p.sub}</div>
                        </div>
                      </div>
                      {platform === p.key && (
                        <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.badges.map((b) => (
                        <span
                          key={b}
                          className="inline-flex items-center rounded bg-white px-2 py-0.5 text-[10.5px] font-medium text-[var(--color-ink-3)] ring-1 ring-[var(--color-line)]"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Account type */}
            <section className="card p-5">
              <SectionTitle title="Account type" subtitle="Choose based on your trading volume" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`relative flex flex-col gap-1.5 rounded-md border p-4 text-left ${
                      type === t.key
                        ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    {t.recommended && (
                      <span className="absolute -top-2 right-3 inline-flex items-center rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-white">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-[var(--color-ink)]">{t.name}</span>
                      {type === t.key && (
                        <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />
                      )}
                    </div>
                    <div className="tabular text-[11.5px] text-[var(--color-ink-3)]">
                      Spread <span className="font-medium text-[var(--color-ink-2)]">{t.spread}</span>
                    </div>
                    <div className="tabular text-[11.5px] text-[var(--color-ink-3)]">
                      Commission{" "}
                      <span className="font-medium text-[var(--color-ink-2)]">{t.commission}</span>
                    </div>
                    <div className="tabular text-[11.5px] text-[var(--color-ink-3)]">{t.min}</div>
                    <p className="mt-1 text-[11.5px] text-[var(--color-ink-4)]">{t.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Currency + leverage */}
            <section className="card p-5">
              <SectionTitle title="Base currency & leverage" subtitle="Leverage is subject to FPG and your jurisdiction" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[11.5px] font-medium text-[var(--color-ink-2)]">Currency</div>
                  <div className="grid grid-cols-4 gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`h-10 rounded-md border text-[12.5px] font-semibold ${
                          currency === c
                            ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                            : "border-[var(--color-line)] bg-white text-[var(--color-ink-3)] hover:border-[var(--color-line-strong)]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[11.5px] font-medium text-[var(--color-ink-2)]">Leverage</div>
                  <div className="grid grid-cols-4 gap-2">
                    {LEVERAGES.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLeverage(l)}
                        className={`h-10 rounded-md border text-[12.5px] font-semibold ${
                          leverage === l
                            ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                            : "border-[var(--color-line)] bg-white text-[var(--color-ink-3)] hover:border-[var(--color-line-strong)]"
                        }`}
                      >
                        {l}:1
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-ink-4)]">
                    Higher leverage increases both potential gains and losses. You can lower this
                    later from your dashboard.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="self-start">
            <div className="card p-5">
              <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                Your configuration
              </div>
              <dl className="flex flex-col gap-2 text-[12.5px]">
                <Row label="Mode">{mode}</Row>
                <Row label="Platform">{platform}</Row>
                <Row label="Type">{type}</Row>
                <Row label="Currency">{currency}</Row>
                <Row label="Leverage">{leverage}:1</Row>
              </dl>
              <div className="mt-4 flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5 text-[11.5px] text-[var(--color-ink-3)]">
                <I.Info size={12} className="text-[var(--color-ink-4)]" />
                Your account will be created instantly once your identity is verified by FPG.
              </div>
              <Link href="/portal" className="btn-primary mt-4 h-11 w-full text-[13.5px]">
                Create account
                <I.ChevronRight size={12} />
              </Link>
              <p className="mt-3 text-[10.5px] text-[var(--color-ink-4)]">
                By clicking <span className="font-medium">Create account</span> you confirm the FPG
                Terms and consent to FPG creating an MT4/MT5 account in your name.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[14.5px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>
      <p className="text-[11.5px] text-[var(--color-ink-4)]">{subtitle}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--color-line-subtle)] pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[var(--color-ink-4)]">{label}</dt>
      <dd className="font-medium text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}
