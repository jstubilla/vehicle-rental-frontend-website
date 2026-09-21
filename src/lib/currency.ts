/** The currency code, for places that need it as data (e.g. search engine markup). Change it here only. */
export const CURRENCY_CODE = "PHP";

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: CURRENCY_CODE,
});

/** The ONLY way money is displayed in this app. Amounts are plain PHP numbers. */
export function formatCurrency(amount: number): string {
  return phpFormatter.format(amount);
}
