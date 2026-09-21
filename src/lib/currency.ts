const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

/** The ONLY way money is displayed in this app. Amounts are plain PHP numbers. */
export function formatCurrency(amount: number): string {
  return phpFormatter.format(amount);
}
