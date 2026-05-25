"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApexMark, PoweredByFPG } from "@/components/Brand";
import { I } from "@/components/Icon";
import { Field } from "@/components/ui";

const STEPS = [
  { key: "identity", label: "Identity" },
  { key: "address", label: "Address & tax" },
  { key: "consents", label: "Agreements" },
  { key: "suitability", label: "Suitability" },
  { key: "verify", label: "Verify email" },
];

export default function PortalSignupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/portal/onboarding/kyc");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-bg)] px-6 py-3">
        <Link href="/portal-login" className="flex items-center gap-2.5">
          <ApexMark size={22} />
          <span className="text-[14.5px] font-semibold tracking-tight">APEX</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">
            Open an account
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <PoweredByFPG />
          <Link href="/portal-login" className="text-[12.5px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">
            Already have an account?
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-10">
        {/* Stepper */}
        <ol className="flex flex-wrap items-center gap-1.5 text-[12px]">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i < step
                    ? "bg-[var(--color-success)] text-white"
                    : i === step
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-[var(--color-bg-muted)] text-[var(--color-ink-4)]"
                }`}
              >
                {i < step ? <I.Check size={12} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={`hidden sm:inline ${
                  i === step ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-3)]"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="mx-1 h-px w-6 sm:w-10 bg-[var(--color-line)]" />
              )}
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form */}
          <div className="card p-6 lg:p-8">
            {step === 0 && <IdentityForm onNext={next} />}
            {step === 1 && <AddressForm onNext={next} />}
            {step === 2 && <ConsentsForm onNext={next} />}
            {step === 3 && <SuitabilityForm onNext={next} />}
            {step === 4 && <VerifyEmail onNext={next} />}

            <div className="mt-6 flex items-center justify-between border-t border-[var(--color-line-subtle)] pt-4">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className="btn-ghost"
                disabled={step === 0}
              >
                Back
              </button>
              <button onClick={() => next()} className="btn-primary">
                {step === STEPS.length - 1 ? "Continue to KYC" : "Continue"}
                <I.ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-3 self-start">
            <div className="card p-4">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                What we ask
              </div>
              <ul className="flex flex-col gap-2 text-[12.5px] text-[var(--color-ink-2)]">
                {[
                  "Personal information & tax country",
                  "ID document & proof of address",
                  "A short suitability questionnaire",
                  "Email & phone verification",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <I.CircleCheck size={12} className="mt-0.5 shrink-0 text-[var(--color-brand-2)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-4">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                <I.Lock size={11} />
                Your data
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--color-ink-3)]">
                Your information is shared securely with <span className="font-semibold text-[var(--color-ink-2)]">Fortune
                Prime Global</span>, the regulated broker behind APEX. APEX never stores card or
                banking details — those go directly to the licensed PSP.
              </p>
            </div>

            <div className="card p-4 text-[12px] text-[var(--color-ink-3)]">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                Need help?
              </div>
              <p>
                Drop us a line at{" "}
                <a href="#" className="text-[var(--color-brand-2)] hover:underline">
                  onboarding@apex.com
                </a>{" "}
                — average reply &lt; 2h.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function IdentityForm({ onNext }: { onNext: () => void }) {
  return (
    <>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Tell us who you are</h2>
      <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
        Use your legal name as it appears on your ID. You can edit details later.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="First name">
          <input className="input" placeholder="Sebastian" />
        </Field>
        <Field label="Last name">
          <input className="input" placeholder="Lindqvist" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" placeholder="you@email.com" />
        </Field>
        <Field label="Phone">
          <input className="input" placeholder="+46 70 123 45 67" />
        </Field>
        <Field label="Date of birth">
          <input className="input" type="date" defaultValue="1989-04-12" />
        </Field>
        <Field label="Nationality">
          <select className="input">
            <option>Sweden</option>
            <option>France</option>
            <option>United Kingdom</option>
            <option>Germany</option>
          </select>
        </Field>
      </div>
    </>
  );
}

function AddressForm({ onNext }: { onNext: () => void }) {
  return (
    <>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Where do you live?</h2>
      <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
        Your residential address and tax residency. Used for KYC and regulatory reporting.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Country of residence">
          <select className="input">
            <option>Sweden</option>
            <option>France</option>
          </select>
        </Field>
        <Field label="Tax residency">
          <select className="input">
            <option>Sweden</option>
            <option>France</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Street address">
            <input className="input" placeholder="Drottninggatan 12" />
          </Field>
        </div>
        <Field label="City">
          <input className="input" placeholder="Stockholm" />
        </Field>
        <Field label="Postal code">
          <input className="input" placeholder="111 51" />
        </Field>
        <Field label="US person?" hint="Required by FATCA regulation">
          <div className="flex gap-2">
            <button className="flex-1 rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-[12.5px] hover:border-[var(--color-line-strong)]">
              No
            </button>
            <button className="flex-1 rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-[12.5px] hover:border-[var(--color-line-strong)]">
              Yes
            </button>
          </div>
        </Field>
        <Field label="Source of funds">
          <select className="input">
            <option>Employment</option>
            <option>Self-employment / business</option>
            <option>Investment income</option>
            <option>Inheritance / gift</option>
          </select>
        </Field>
      </div>
    </>
  );
}

function ConsentsForm({ onNext }: { onNext: () => void }) {
  const items = [
    {
      title: "FPG Terms & Conditions",
      sub: "The contractual agreement with Fortune Prime Global, the broker.",
      required: true,
    },
    {
      title: "Risk disclosure",
      sub: "CFD / FX trading involves substantial risk. Please read carefully.",
      required: true,
    },
    {
      title: "Order execution policy",
      sub: "How orders are routed, priced and executed by FPG.",
      required: true,
    },
    {
      title: "Privacy notice",
      sub: "How APEX and FPG process your personal data.",
      required: true,
    },
    {
      title: "Marketing communications",
      sub: "Receive product updates and market analysis. You can opt out anytime.",
      required: false,
    },
  ];
  return (
    <>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Read and accept</h2>
      <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
        These documents are required by Fortune Prime Global, the regulated broker hosting your
        account. Please review each before continuing.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-md border border-[var(--color-line)] bg-white p-3.5"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded"
              defaultChecked={it.required}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--color-ink)]">{it.title}</span>
                {it.required ? (
                  <span className="inline-flex items-center rounded bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                    Required
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded bg-[var(--color-bg-muted)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
                    Optional
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--color-ink-4)]">{it.sub}</div>
            </div>
            <a href="#" className="text-[12px] text-[var(--color-brand-2)] hover:underline">
              Read
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function SuitabilityForm({ onNext }: { onNext: () => void }) {
  return (
    <>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Suitability questionnaire</h2>
      <p className="mt-1 text-[13px] text-[var(--color-ink-3)]">
        Required by regulation. Helps us recommend appropriate products and leverage.
      </p>
      <div className="mt-6 flex flex-col gap-5">
        <RadioRow
          label="What is your trading experience?"
          options={["None", "< 1 year", "1–2 years", "3–5 years", "> 5 years"]}
          defaultSelected={3}
        />
        <RadioRow
          label="How would you describe your risk tolerance?"
          options={["Conservative", "Balanced", "Growth", "Aggressive"]}
          defaultSelected={2}
        />
        <RadioRow
          label="Approximate net worth (excluding primary residence)"
          options={["< €50k", "€50k–€250k", "€250k–€1M", "> €1M"]}
          defaultSelected={1}
        />
        <RadioRow
          label="What is your primary trading objective?"
          options={["Capital preservation", "Income", "Capital growth", "Speculation"]}
          defaultSelected={2}
        />
      </div>
    </>
  );
}

function RadioRow({
  label,
  options,
  defaultSelected,
}: {
  label: string;
  options: string[];
  defaultSelected?: number;
}) {
  return (
    <div>
      <div className="mb-2 text-[12.5px] font-medium text-[var(--color-ink-2)]">{label}</div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {options.map((o, i) => (
          <button
            key={o}
            className={`h-9 rounded-md border px-3 text-[12.5px] ${
              i === defaultSelected
                ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-semibold"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink-3)] hover:border-[var(--color-line-strong)]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function VerifyEmail({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
        <I.Mail size={22} className="text-[var(--color-brand)]" />
      </div>
      <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.01em]">Check your inbox</h2>
      <p className="mt-1 max-w-md text-[13px] text-[var(--color-ink-3)]">
        We sent a verification link to <span className="font-medium text-[var(--color-ink-2)]">s.lindqvist@northforest.io</span>.
        Click it to confirm your email, then continue to upload your ID.
      </p>
      <div className="mt-6 flex w-full max-w-[280px] items-center justify-between text-[12px] text-[var(--color-ink-3)]">
        <span className="inline-flex items-center gap-1.5">
          <I.Clock size={12} />
          Resend in 0:48
        </span>
        <button className="text-[var(--color-brand-2)] hover:underline">Change email</button>
      </div>
    </div>
  );
}
