// Static FX rates anchored at the demo NOW. Used purely for cross-currency
// aggregation in the UI (e.g. totalling AUM across accounts). Not for trading.
export const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.085,
  GBP: 1.273,
  JPY: 0.0064,
  CHF: 1.116,
  AUD: 0.658,
};

export function toUSD(amount: number, currency: string): number {
  const rate = FX_TO_USD[currency.toUpperCase()];
  if (!rate) return amount; // unknown currency — return as-is rather than crash
  return amount * rate;
}
