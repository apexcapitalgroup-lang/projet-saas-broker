"use client";

import * as React from "react";
import Link from "next/link";
import { ApexMark, PoweredByFPG } from "@/components/Brand";
import { I } from "@/components/Icon";
import { Pill, SecureChip } from "@/components/ui";

type DocStatus = "missing" | "uploaded" | "verified" | "rejected";

const DOCS: { key: string; title: string; sub: string; status: DocStatus }[] = [
  {
    key: "id-front",
    title: "Government ID — front",
    sub: "Passport, national ID or driving licence",
    status: "verified",
  },
  {
    key: "id-back",
    title: "Government ID — back",
    sub: "Required for national IDs and licences (not passport)",
    status: "uploaded",
  },
  {
    key: "selfie",
    title: "Selfie / liveness check",
    sub: "Short video — takes 10 seconds. We never store it on APEX.",
    status: "missing",
  },
  {
    key: "address",
    title: "Proof of address",
    sub: "Utility bill or bank statement dated within the last 3 months",
    status: "missing",
  },
];

export default function OnboardingKycPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-bg)] px-6 py-3">
        <Link href="/portal" className="flex items-center gap-2.5">
          <ApexMark size={22} />
          <span className="text-[14.5px] font-semibold tracking-tight">APEX</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-4)]">
            Verify identity
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <PoweredByFPG />
          <span className="text-[12px] text-[var(--color-ink-3)]">Step 2 of 3</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-10">
        {/* Hero / progress */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Verify your identity</h1>
          <p className="text-[13.5px] text-[var(--color-ink-3)]">
            Upload your documents below. Our partner Fortune Prime Global typically reviews them
            within <span className="font-medium text-[var(--color-ink-2)]">4 business hours</span>.
            You can start trading on a demo account in the meantime.
          </p>
        </div>

        {/* Progress card */}
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg width={42} height={42} viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" stroke="#eef1f6" strokeWidth="4" fill="none" />
                <circle
                  cx="21"
                  cy="21"
                  r="17"
                  stroke="#1730E4"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 17 * 0.5} ${2 * Math.PI * 17}`}
                  strokeLinecap="round"
                  transform="rotate(-90 21 21)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10.5px] font-semibold">
                50%
              </div>
            </div>
            <div>
              <div className="text-[13.5px] font-semibold">2 of 4 documents</div>
              <div className="text-[11.5px] text-[var(--color-ink-4)]">
                Continue uploading to unlock your live account.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SecureChip tone="brand">256-bit encrypted upload</SecureChip>
            <Pill tone="info">Reviewed by FPG</Pill>
          </div>
        </div>

        {/* Docs */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {DOCS.map((d) => (
            <DocCard key={d.key} doc={d} />
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-[var(--color-ink-4)]">
            By submitting documents you authorize FPG and its KYC provider to verify your identity.
          </p>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="btn-ghost">
              Save & finish later
            </Link>
            <Link href="/portal/onboarding/account" className="btn-primary">
              Continue
              <I.ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({ doc }: { doc: typeof DOCS[number] }) {
  const status = doc.status;
  const tone: "success" | "info" | "danger" | "neutral" =
    status === "verified"
      ? "success"
      : status === "uploaded"
        ? "info"
        : status === "rejected"
          ? "danger"
          : "neutral";
  const label =
    status === "verified"
      ? "Verified"
      : status === "uploaded"
        ? "Under review"
        : status === "rejected"
          ? "Rejected"
          : "To upload";

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-md ${
              status === "verified"
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : status === "uploaded"
                  ? "bg-[var(--color-info-soft)] text-[var(--color-info)]"
                  : status === "rejected"
                    ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                    : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
            }`}
          >
            <I.Document size={16} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-[var(--color-ink)]">{doc.title}</div>
            <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">{doc.sub}</div>
          </div>
        </div>
        <Pill tone={tone}>{label}</Pill>
      </div>

      {status === "missing" ? (
        <button className="flex h-24 items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--color-line-strong)] bg-[var(--color-bg-subtle)] text-[12.5px] font-medium text-[var(--color-ink-3)] hover:border-[var(--color-brand-2)] hover:bg-[var(--color-brand-tint)] hover:text-[var(--color-brand)]">
          <I.Plus size={14} />
          Drop file or click to upload
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-white text-[var(--color-ink-3)]">
              <I.Document size={12} />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-medium text-[var(--color-ink)]">
                {doc.key === "id-front" ? "passport_lindqvist_front.pdf" : "id_back.pdf"}
              </span>
              <span className="text-[10.5px] text-[var(--color-ink-4)]">
                Uploaded · 1.2 MB · sha256 c9a4…b7e1
              </span>
            </div>
          </div>
          <button className="btn-ghost">
            <I.X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
