/** The currency code, for places that need it as data (e.g. search engine markup). Change it here only. */
export const CURRENCY_CODE = "PHP";

/**
 * A fixed placeholder exchange rate, since this front end has no backend to fetch a live one.
 * Update this number to change the USD amount shown everywhere, or replace it with a real rate
 * lookup once there is a backend.
 */
export const PHP_PER_USD = 58;

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: CURRENCY_CODE,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** The ONLY way money is displayed in this app: the PHP amount, with its rough USD equivalent alongside it. */
export function formatCurrency(amount: number): string {
  return `${phpFormatter.format(amount)} (~${usdFormatter.format(amount / PHP_PER_USD)})`;
}
