/**
 * Pricing rules. Vehicle prices are a flat daily rate, and prices include VAT.
 * A quote is built from the vehicle's CURRENT rate; once a booking is created it
 * keeps that rate, so later rate changes only affect new bookings.
 */
export interface Quote {
  days: number;
  dailyRate: number;
  vehicleTotal: number;
  total: number;
}

export function buildQuote({ dailyRate, days }: { dailyRate: number; days: number }): Quote {
  const vehicleTotal = dailyRate * days;
  return { days, dailyRate, vehicleTotal, total: vehicleTotal };
}
