"use client";

import * as React from "react";
import Link from "next/link";
import { I } from "@/components/Icon";
import { Card, CardHeader, Field, Pill, SecureChip, SectionHeader, StatusPill } from "@/components/ui";
import { DEPOSITS, TRADING_ACCOUNTS, fmtDate, fmtMoney } from "@/lib/mock";

const METHODS = [
  {
    key: "card",
    name: "Visa / Mastercard",
    sub: "Instant · 1.5% PSP fee",
    fee: 0.015,
    instant: true,
    minutes: 0,
    badges: ["3D Secure", "PSP-hosted"],
    icon: "Wallet" as const,
  },
  {
    key: "bank",
    name: "Bank transfer (SWIFT/SEPA)",
    sub: "1–2 business days · no fee",
    fee: 0,
    instant: false,
    minutes: 1440,
    badges: ["No fee", "Wire instructions from FPG"],
    icon: "Building" as const,
  },
  {
    key: "usdt",
    name: "USDT (TRC20)",
    sub: "~10 minutes · 0.5% network fee",
    fee: 0.005,
    instant: true,
    minutes: 10,
    badges: ["Crypto", "FPG-Crypto-Gateway"],
    icon: "Globe" as const,
  },
  {
    key: "skrill",
    name: "Skrill / Neteller",
    sub: "Instant · 2.0% PSP fee",
    fee: 0.02,
    instant: true,
    minutes: 0,
    badges: ["E-wallet"],
    icon: "Wallet" as const,
  },
];

const QUICK_AMOUNTS = [500, 1000, 5000, 10_000, 25_000, 50_000];

export default function DepositPage() {
  const myAccounts = TRADING_ACCOUNTS.filter((a) => a.clientApexId === "APX-100482");
  const [methodKey, setMethodKey] = React.useState("card");
  const [amount, setAmount] = React.useState(5000);
  const [account, setAccount] = React.useState(myAccounts[0]?.login ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const method = METHODS.find((m) => m.key === methodKey)!;
  const fee = amount * method.fee;
  const credited = amount - fee;

  const apiMethodKey =
    methodKey === "card"
      ? "visa_mc"
      : methodKey === "bank"
        ? "bank_transfer"
        : methodKey === "usdt"
          ? "usdt_trc20"
          : "skrill";

  async function continueToPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_login: account,
          amount,
          currency: "USD",
          method_key: apiMethodKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.hosted_url) {
        setError(data?.error?.message ?? "Could not initiate deposit");
        setBusy(false);
        return;
      }
      // Redirect to the hosted-payment URL (FPG PSP mock)
      window.location.href = data.hosted_url;
    } catch {
      setError("Network error");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Deposit funds"
        description="Funds go directly to Fortune Prime Global. APEX never receives or holds your money."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Account picker */}
          <Card padding="p-5">
            <CardHeader title="Choose account" description="Funds will be credited to this account" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {myAccounts.map((a) => (
                <button
                  key={a.login}
                  onClick={() => setAccount(a.login)}
                  className={`flex items-center justify-between rounded-md border p-3 text-left ${
                    account === a.login
                      ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-ink)] text-[10px] font-bold text-white">
                      {a.platform}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="mono text-[12.5px] font-semibold">{a.login}</span>
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">
                        {a.accountType} · {a.mode} · {a.currency}
                      </span>
                    </div>
                  </div>
                  <span className="tabular text-[12px] text-[var(--color-ink-3)]">
                    {fmtMoney(a.equity, a.currency)}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Amount */}
          <Card padding="p-5">
            <CardHeader title="Amount" description="Minimum $100 · maximum per transaction $250,000" />
            <Field label="Amount">
              <div className="flex h-12 items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-3 focus-within:border-[var(--color-brand-2)] focus-within:ring-2 focus-within:ring-[rgba(23,48,228,0.12)]">
                <span className="text-[20px] font-semibold text-[var(--color-ink-4)]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value || 0))}
                  className="tabular flex-1 bg-transparent text-[22px] font-semibold outline-none"
                />
                <select className="bg-transparent text-[12.5px] font-medium text-[var(--color-ink-3)] outline-none">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`h-8 rounded-md border px-3 text-[12px] font-medium ${
                    amount === q
                      ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-line)] bg-white text-[var(--color-ink-3)] hover:border-[var(--color-line-strong)]"
                  }`}
                >
                  ${q.toLocaleString()}
                </button>
              ))}
            </div>
          </Card>

          {/* Method */}
          <Card padding="p-5">
            <CardHeader title="Payment method" description="All methods are PSP-hosted by FPG" />
            <div className="flex flex-col gap-2">
              {METHODS.map((m) => {
                const Icon = I[m.icon];
                const selected = methodKey === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMethodKey(m.key)}
                    className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left ${
                      selected
                        ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-md ${
                          selected
                            ? "bg-white text-[var(--color-brand)]"
                            : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--color-ink)]">{m.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--color-ink-4)]">
                          <I.Clock size={10} />
                          {m.sub}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-1.5">
                        {m.badges.map((b) => (
                          <span
                            key={b}
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-medium ${
                              selected
                                ? "bg-white text-[var(--color-brand)]"
                                : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
                            }`}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      {selected && (
                        <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Summary */}
        <aside className="self-start">
          <Card padding="p-5">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
              Summary
            </div>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              <Row label="To account">
                <span className="mono">{account}</span>
              </Row>
              <Row label="Method">{method.name}</Row>
              <Row label="Processing time">
                {method.instant ? "Instant" : `${method.minutes / 60}–${method.minutes / 60 + 24}h`}
              </Row>
              <Row label="Amount">
                <span className="tabular">${amount.toLocaleString()}</span>
              </Row>
              <Row label="PSP fee">
                <span className="tabular text-[var(--color-ink-3)]">
                  − ${fee.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </Row>
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
              <span className="text-[12.5px] font-medium text-[var(--color-ink)]">Credited</span>
              <span className="tabular text-[18px] font-semibold text-[var(--color-ink)]">
                ${credited.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[11.5px] text-[var(--color-ink-3)]">
              <div className="mb-1 inline-flex items-center gap-1.5 text-[var(--color-brand)] font-medium">
                <I.Lock size={11} />
                You will be redirected
              </div>
              <p>
                APEX opens a PSP-hosted page operated by FPG. We never see your card or bank
                details — only the success or failure response.
              </p>
            </div>

            <button
              type="button"
              onClick={continueToPayment}
              disabled={busy}
              className="btn-primary mt-4 h-11 w-full text-[14px]"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Initiating payment…
                </span>
              ) : (
                <>
                  Continue to payment
                  <I.ChevronRight size={12} />
                </>
              )}
            </button>
            {error && (
              <div className="mt-2 rounded-md border border-[var(--color-danger-soft)] bg-[var(--color-danger-soft)] px-3 py-2 text-[12px] text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-[10.5px] text-[var(--color-ink-4)]">
              <SecureChip>TLS 1.3</SecureChip>
              <SecureChip>3D Secure</SecureChip>
              <SecureChip>PCI DSS</SecureChip>
            </div>
          </Card>
        </aside>
      </div>

      {/* Recent deposits */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
          <div>
            <h3 className="text-[13.5px] font-semibold">Your recent deposits</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              All deposits are processed and settled by FPG
            </p>
          </div>
          <Link href="/portal/transactions" className="btn-ghost text-[var(--color-brand)]">
            All transactions
            <I.ChevronRight size={12} />
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Account</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th>FPG reference</th>
            </tr>
          </thead>
          <tbody>
            {DEPOSITS.filter((d) => d.clientApexId === "APX-100482").map((d) => (
              <tr key={d.id}>
                <td className="text-[var(--color-ink-3)]">{fmtDate(d.createdAt, { time: true })}</td>
                <td>{d.method}</td>
                <td className="mono text-[11.5px]">{d.account}</td>
                <td className="text-right tabular font-semibold text-[var(--color-success)]">
                  +{fmtMoney(d.amount, d.currency)}
                </td>
                <td>
                  <StatusPill status={d.status} />
                </td>
                <td className="mono text-[11px]">{d.fpgTxnId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--color-line-subtle)] pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[var(--color-ink-4)]">{label}</dt>
      <dd className="text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}
