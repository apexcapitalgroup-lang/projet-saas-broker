import { notFound } from "next/navigation";
import { findDeposit } from "@/server/store";
import { fmtMoney } from "@/lib/format";
import { ApexMark } from "@/components/Brand";
import { I } from "@/components/Icon";
import { PspActions } from "./PspActions";

export const dynamic = "force-dynamic";

export default async function PspMockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deposit = await findDeposit(id);
  if (!deposit) notFound();

  const cardLast4 = "4242";
  const merchantName = "Fortune Prime Global Ltd · Hosted Payment";

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)] py-10 px-4">
      <div className="mx-auto flex max-w-[920px] flex-col gap-4">
        {/* Brand bar: simulates the PSP page hosted on FPG side */}
        <div className="flex items-center justify-between text-[12px] text-[var(--color-ink-4)]">
          <div className="flex items-center gap-2">
            <I.Lock size={14} className="text-[var(--color-success)]" />
            Secure payment by{" "}
            <span className="font-semibold text-[var(--color-ink-2)]">FPG-PSP</span>
            <span className="text-[var(--color-ink-5)]">·</span>
            <span className="mono">psp.fortuneprime.com</span>
          </div>
          <div className="flex items-center gap-2">
            <ApexMark size={18} />
            <span className="text-[var(--color-ink-3)]">on behalf of APEX</span>
          </div>
        </div>

        {/* Banner — simulated environment */}
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-warning-soft)] bg-[var(--color-warning-soft)] px-3 py-2 text-[12px] text-[var(--color-warning)]">
          <I.Info size={12} />
          This is a simulated hosted-payment page. In production this page would
          be served by the FPG PSP — APEX never sees the card details.
        </div>

        {/* Card */}
        <div className="card grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
          {/* Left: form */}
          <div className="border-b md:border-b-0 md:border-r border-[var(--color-line)] p-6">
            <div className="mb-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
                Merchant
              </div>
              <div className="mt-0.5 text-[14px] font-semibold text-[var(--color-ink)]">
                {merchantName}
              </div>
            </div>

            <h2 className="text-[16px] font-semibold tracking-tight">Payment details</h2>
            <p className="mt-1 text-[12.5px] text-[var(--color-ink-3)]">
              Enter your card information below. All fields are encrypted (TLS 1.3,
              PCI DSS Level 1) and never leave the FPG PSP environment.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <FakeField label="Card number" value={`4242 4242 4242 ${cardLast4}`} icon="Wallet" />
              <div className="grid grid-cols-2 gap-3">
                <FakeField label="Expiry" value="12 / 28" />
                <FakeField label="CVC" value="•••" />
              </div>
              <FakeField label="Cardholder" value={deposit.clientApexId} icon="Users" />
            </div>

            <div className="mt-5 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-subtle)] p-3 text-[11.5px] text-[var(--color-ink-3)]">
              <div className="mb-1 inline-flex items-center gap-1.5 text-[var(--color-brand)] font-semibold">
                <I.Shield size={11} />
                3D Secure 2.0
              </div>
              You may be asked to confirm this payment with your bank.
            </div>
          </div>

          {/* Right: summary + actions */}
          <div className="p-6">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-4)]">
              Order summary
            </div>
            <div className="mt-2 flex flex-col gap-2 text-[12.5px]">
              <Row label="Reference">
                <span className="mono">{deposit.fpgTxnId}</span>
              </Row>
              <Row label="Account">
                <span className="mono">{deposit.accountLogin}</span>
              </Row>
              <Row label="Method">{deposit.method}</Row>
              <Row label="Status">
                <span className="capitalize">{deposit.status}</span>
              </Row>
              <Row label="PSP fee">
                <span className="tabular text-[var(--color-ink-3)]">
                  {fmtMoney(deposit.fees, deposit.currency)}
                </span>
              </Row>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
              <span className="text-[12.5px] font-semibold">Total to debit</span>
              <span className="tabular text-[20px] font-semibold">
                {fmtMoney(deposit.amount, deposit.currency)}
              </span>
            </div>

            <PspActions
              depositId={deposit.id}
              status={deposit.status}
              clientApexId={deposit.clientApexId}
            />

            <div className="mt-4 flex flex-col items-center gap-1.5 text-[10.5px] text-[var(--color-ink-4)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Connection encrypted · TLS 1.3
              </div>
              <div>Powered by FPG-PSP · Member of PCI DSS council</div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10.5px] text-[var(--color-ink-4)]">
          Need help? Contact <a className="underline" href="#">payments@fortuneprime.com</a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-1.5 last:border-b-0 last:pb-0">
      <span className="text-[var(--color-ink-4)]">{label}</span>
      <span className="text-[var(--color-ink)]">{children}</span>
    </div>
  );
}

function FakeField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: keyof typeof I;
}) {
  const Icon = icon ? I[icon] : null;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-[var(--color-ink-3)]">{label}</span>
      <div className="flex h-10 items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-3 text-[13px]">
        {Icon && <Icon size={14} className="text-[var(--color-ink-4)]" />}
        <span className="tabular text-[var(--color-ink-2)]">{value}</span>
      </div>
    </label>
  );
}
