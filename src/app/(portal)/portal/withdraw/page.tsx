"use client";

import * as React from "react";
import Link from "next/link";
import { I } from "@/components/Icon";
import { Card, CardHeader, Field, Pill, SecureChip, SectionHeader, StatusPill } from "@/components/ui";
import { TRADING_ACCOUNTS, WITHDRAWALS, fmtDate, fmtMoney } from "@/lib/mock";

export default function WithdrawPage() {
  const myAccounts = TRADING_ACCOUNTS.filter((a) => a.clientApexId === "APX-100482");
  const myWithdrawals = WITHDRAWALS.filter((w) => w.clientApexId === "APX-100482");
  const [amount, setAmount] = React.useState(8000);
  const [from, setFrom] = React.useState(myAccounts[0]?.login ?? "");
  const [method, setMethod] = React.useState("card");

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Withdraw funds"
        description="Withdrawals are reviewed by FPG compliance and paid out to your verified payment method."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Source */}
          <Card padding="p-5">
            <CardHeader title="Withdraw from" description="Select an account with available free margin" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {myAccounts.map((a) => (
                <button
                  key={a.login}
                  onClick={() => setFrom(a.login)}
                  className={`flex items-center justify-between rounded-md border p-3 text-left ${
                    from === a.login
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
                        Free margin · {fmtMoney(a.freeMargin, a.currency)}
                      </span>
                    </div>
                  </div>
                  {from === a.login && <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />}
                </button>
              ))}
            </div>
          </Card>

          {/* Amount */}
          <Card padding="p-5">
            <CardHeader title="Amount" description="Minimum $50 · maximum equals free margin" />
            <Field label="Amount">
              <div className="flex h-12 items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-3 focus-within:border-[var(--color-brand-2)] focus-within:ring-2 focus-within:ring-[rgba(23,48,228,0.12)]">
                <span className="text-[20px] font-semibold text-[var(--color-ink-4)]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value || 0))}
                  className="tabular flex-1 bg-transparent text-[22px] font-semibold outline-none"
                />
                <button className="text-[11.5px] font-semibold text-[var(--color-brand-2)]">
                  Max
                </button>
              </div>
            </Field>
            <div className="mt-2 text-[11.5px] text-[var(--color-ink-4)]">
              You'll have <span className="font-semibold text-[var(--color-ink-2)]">$77,992.55</span>{" "}
              of free margin left after this withdrawal.
            </div>
          </Card>

          {/* Method */}
          <Card padding="p-5">
            <CardHeader
              title="Destination"
              description="Withdrawals return to the source of deposit when possible (AML rule)"
            />
            <div className="flex flex-col gap-2">
              {[
                {
                  key: "card",
                  name: "Visa **** 4421",
                  sub: "Original deposit source · refund up to $25,000",
                  available: "$25,000 / $25,000 used",
                  icon: "Wallet" as const,
                },
                {
                  key: "bank",
                  name: "SEB · SE45 5000 **** **** 4821",
                  sub: "Bank transfer · 1–2 business days",
                  available: "Verified · no limit",
                  icon: "Building" as const,
                },
              ].map((m) => {
                const Icon = I[m.icon];
                const selected = method === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={`flex items-center justify-between rounded-md border p-3 text-left ${
                      selected
                        ? "border-[var(--color-brand-2)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-md ${
                          selected ? "bg-white text-[var(--color-brand)]" : "bg-[var(--color-bg-muted)] text-[var(--color-ink-3)]"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--color-ink)]">{m.name}</div>
                        <div className="mt-0.5 text-[11px] text-[var(--color-ink-4)]">{m.sub}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-[var(--color-ink-4)]">{m.available}</span>
                      {selected && <I.CircleCheck size={14} className="text-[var(--color-brand-2)]" />}
                    </div>
                  </button>
                );
              })}
              <button className="flex items-center gap-2 rounded-md border border-dashed border-[var(--color-line-strong)] bg-[var(--color-bg-subtle)] p-3 text-[12.5px] text-[var(--color-ink-3)] hover:border-[var(--color-brand-2)] hover:text-[var(--color-brand)]">
                <I.Plus size={14} />
                Add a verified payment method
              </button>
            </div>
          </Card>

          {/* AML checks */}
          <Card padding="p-5">
            <CardHeader
              title="AML checks · automated"
              description="FPG runs these before approval"
            />
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[12px]">
              {[
                ["Identity verified", true],
                ["Source of funds documented", true],
                ["Trading activity threshold met", true],
                ["Payment method consistency", true],
                ["Country risk score", true],
                ["Sanctions screen", true],
              ].map(([label, ok], i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-2.5"
                >
                  {ok ? (
                    <I.CircleCheck size={14} className="text-[var(--color-success)]" />
                  ) : (
                    <I.AlertTriangle size={14} className="text-[var(--color-warning)]" />
                  )}
                  <span className="text-[var(--color-ink-2)]">{label as string}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Summary */}
        <aside className="self-start">
          <Card padding="p-5">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-4)]">
              Summary
            </div>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              <Row label="From">
                <span className="mono">{from}</span>
              </Row>
              <Row label="To">{method === "card" ? "Visa **** 4421" : "SEB bank account"}</Row>
              <Row label="Processing">{method === "card" ? "Same day after approval" : "1–2 business days"}</Row>
              <Row label="Withdrawal fee">
                <span className="tabular text-[var(--color-ink-3)]">$0.00</span>
              </Row>
            </dl>
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
              <span className="text-[12.5px] font-medium text-[var(--color-ink)]">You receive</span>
              <span className="tabular text-[18px] font-semibold text-[var(--color-ink)]">
                ${amount.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[11.5px] text-[var(--color-ink-3)]">
              <div className="mb-1 inline-flex items-center gap-1.5 text-[var(--color-ink-2)] font-medium">
                <I.Clock size={11} />
                Expected timeline
              </div>
              <p>Submission · today · 09:00 → Review · within 2h → Payout · same business day.</p>
            </div>

            <button className="btn-primary mt-4 h-11 w-full text-[14px]">
              Submit withdrawal request
            </button>
            <p className="mt-3 text-center text-[10.5px] text-[var(--color-ink-4)]">
              You'll receive an email at every step.
            </p>
          </Card>
        </aside>
      </div>

      {/* Recent withdrawals */}
      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] px-5 py-3">
          <div>
            <h3 className="text-[13.5px] font-semibold">Your recent withdrawals</h3>
            <p className="mt-0.5 text-[11.5px] text-[var(--color-ink-4)]">
              Each withdrawal is reviewed by FPG before payout
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
              <th>Created</th>
              <th>Method</th>
              <th>Account</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {myWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-[var(--color-ink-4)]">
                  No withdrawal yet.
                </td>
              </tr>
            ) : (
              myWithdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="text-[var(--color-ink-3)]">{fmtDate(w.createdAt, { time: true })}</td>
                  <td>{w.method}</td>
                  <td className="mono text-[11.5px]">{w.account}</td>
                  <td className="text-right tabular font-semibold">
                    −{fmtMoney(w.amount, w.currency)}
                  </td>
                  <td>
                    <StatusPill status={w.status} />
                  </td>
                  <td className="mono text-[11px]">
                    {w.fpgTxnId ?? <span className="text-[var(--color-ink-5)]">—</span>}
                  </td>
                </tr>
              ))
            )}
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
