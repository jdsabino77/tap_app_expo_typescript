/**
 * Number/currency display via `Intl` (no extra weight vs Flutter `intl`).
 */

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInteger(value: number, locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Injectable “units” or other counts. */
export function formatUnits(value: number, locale: string = "en-US"): string {
  return formatInteger(value, locale);
}
