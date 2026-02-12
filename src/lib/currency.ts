/**
 * Format a number as XAF currency.
 * Example: formatXAF(1500) => "XAF 1,500"
 */
export function formatXAF(amount: number): string {
  return `XAF ${Math.round(amount).toLocaleString("en-US")}`;
}
