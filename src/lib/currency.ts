/** The currency code, for places that need it as data (e.g. search engine markup). Change it here only. */
export const CURRENCY_CODE = "PHP";

/**
 * A fixed placeholder exchange rate, since this front end has no backend to fetch a live one.
 * Update this number to change the USD amount shown everywhere, or replace it with a real rate
 * lookup once there is a backend.
 */
export const PHP_PER_USD = 58;

/** Exact amounts, always with centavos: totals, payments and the admin. */
const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: CURRENCY_CODE,
});

/** Display prices (daily rates on the public site): whole pesos print without ".00"; centavos still show. */
const phpShortFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The PHP amount on its own. Short by default ("₱4,200"), for daily rates on the public site;
 * `exact` keeps the centavos ("₱4,200.00"), for totals and anything money is paid against.
 */
export function formatPhp(amount: number, { exact = false }: { exact?: boolean } = {}): string {
  return (exact ? phpFormatter : phpShortFormatter).format(amount);
}

/** The rough USD equivalent, e.g. "(~$72)". Shown smaller, as a secondary line, beside the PHP amount. */
export function formatUsd(amount: number): string {
  return `(~${usdFormatter.format(amount / PHP_PER_USD)})`;
}

/**
 * Money as one exact plain string, e.g. "₱4,200.00 (~$72)": totals, payments, the admin, and any place
 * that needs text (button labels, page descriptions). On the page itself, the <Price> component shows
 * a price with the USD amount de-emphasized.
 */
export function formatCurrency(amount: number): string {
  return `${formatPhp(amount, { exact: true })} ${formatUsd(amount)}`;
}
