/**
 * /api/fpg/v1/deposit-methods
 *
 * GET — Lists deposit methods available for a given country, currency and amount.
 *       Cached for 30s on the FPG side (real impl would).
 *
 * Scope: read
 */

import { NextRequest } from "next/server";
import { runFpg, signAndSend } from "@/server/fpg/middleware";

interface Method {
  key: string;
  name: string;
  psp: string;
  flow: "hosted" | "iframe" | "bank_instructions" | "crypto_wallet";
  min_amount: number;
  max_amount: number;
  currencies: string[];
  countries: "all" | string[];
  fee_pct: number;
  fee_fixed: number;
  processing_time_minutes: { min: number; max: number };
  three_d_secure?: boolean;
}

const ALL_METHODS: Method[] = [
  {
    key: "visa_mc",
    name: "Visa / Mastercard",
    psp: "Apex-PSP-FPG",
    flow: "hosted",
    min_amount: 50,
    max_amount: 25_000,
    currencies: ["USD", "EUR", "GBP"],
    countries: "all",
    fee_pct: 0.015,
    fee_fixed: 0,
    processing_time_minutes: { min: 1, max: 5 },
    three_d_secure: true,
  },
  {
    key: "bank_transfer",
    name: "Bank transfer (SWIFT/SEPA)",
    psp: "FPG-Bank-Rails",
    flow: "bank_instructions",
    min_amount: 250,
    max_amount: 1_000_000,
    currencies: ["USD", "EUR", "GBP", "JPY", "CHF"],
    countries: "all",
    fee_pct: 0,
    fee_fixed: 0,
    processing_time_minutes: { min: 1440, max: 2880 },
  },
  {
    key: "usdt_trc20",
    name: "USDT (TRC20)",
    psp: "FPG-Crypto-Gateway",
    flow: "crypto_wallet",
    min_amount: 100,
    max_amount: 500_000,
    currencies: ["USD"],
    countries: "all",
    fee_pct: 0.005,
    fee_fixed: 0,
    processing_time_minutes: { min: 5, max: 30 },
  },
  {
    key: "usdt_erc20",
    name: "USDT (ERC20)",
    psp: "FPG-Crypto-Gateway",
    flow: "crypto_wallet",
    min_amount: 100,
    max_amount: 500_000,
    currencies: ["USD"],
    countries: "all",
    fee_pct: 0.005,
    fee_fixed: 5,
    processing_time_minutes: { min: 15, max: 60 },
  },
  {
    key: "skrill",
    name: "Skrill",
    psp: "Apex-PSP-FPG",
    flow: "hosted",
    min_amount: 50,
    max_amount: 50_000,
    currencies: ["USD", "EUR", "GBP"],
    countries: "all",
    fee_pct: 0.02,
    fee_fixed: 0,
    processing_time_minutes: { min: 0, max: 5 },
  },
  {
    key: "neteller",
    name: "Neteller",
    psp: "Apex-PSP-FPG",
    flow: "hosted",
    min_amount: 50,
    max_amount: 50_000,
    currencies: ["USD", "EUR", "GBP"],
    countries: "all",
    fee_pct: 0.02,
    fee_fixed: 0,
    processing_time_minutes: { min: 0, max: 5 },
  },
];

export async function GET(req: NextRequest) {
  return runFpg(
    req,
    { endpoint: "/v1/deposit-methods", scopes: ["read"] },
    async ({ ctx }) => {
      const { searchParams } = req.nextUrl;
      const country = searchParams.get("country");
      const currency = searchParams.get("currency");
      const amount = Number(searchParams.get("amount") ?? "0");
      const methods = ALL_METHODS.filter((m) => {
        if (currency && !m.currencies.includes(currency)) return false;
        if (country && m.countries !== "all" && !m.countries.includes(country)) return false;
        if (amount > 0 && (amount < m.min_amount || amount > m.max_amount)) return false;
        return true;
      });
      return signAndSend(
        {
          methods,
          cached_for_seconds: 30,
          generated_at: new Date().toISOString(),
        },
        ctx,
        { extraHeaders: { "cache-control": "private, max-age=30" } }
      );
    }
  );
}
