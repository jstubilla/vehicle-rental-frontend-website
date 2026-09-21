import type { BookingExtraLine, Extra } from "@/types";

/**
 * Pricing rules. Vehicle prices are a flat daily rate, and prices include VAT.
 * A quote is built from the vehicle's CURRENT rate; once a booking is created it
 * keeps that rate, so later rate changes only affect new bookings.
 */
export interface Quote {
  days: number;
  dailyRate: number;
  vehicleTotal: number;
  extras: BookingExtraLine[];
  extrasTotal: number;
  total: number;
}

export function priceExtra(extra: Extra, days: number): number {
  return extra.pricing === "per_day" ? extra.price * days : extra.price;
}

export function buildQuote({
  dailyRate,
  days,
  extras,
}: {
  dailyRate: number;
  days: number;
  extras: Extra[];
}): Quote {
  const extraLines: BookingExtraLine[] = extras.map((extra) => ({
    extraId: extra.id,
    name: extra.name,
    pricing: extra.pricing,
    unitPrice: extra.price,
    total: priceExtra(extra, days),
  }));
  const vehicleTotal = dailyRate * days;
  const extrasTotal = extraLines.reduce((sum, line) => sum + line.total, 0);
  return { days, dailyRate, vehicleTotal, extras: extraLines, extrasTotal, total: vehicleTotal + extrasTotal };
}
