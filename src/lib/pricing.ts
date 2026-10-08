import type { VehicleCategory } from "./constants";

/**
 * Pricing rules. Vehicle prices are a flat daily rate, and prices include VAT.
 * A quote is built from the vehicle's CURRENT rate; once a booking is created it
 * keeps that rate, so later rate changes only affect new bookings.
 */

/**
 * "With a driver": a licensed driver comes with the vehicle, charged for every rental day.
 * THE single place this rate is set; everything else (booking, summary, Tours & Transfers page) reads it.
 */
export const DRIVER_DAILY_RATE = 1000;

/** Motorcycles are always "Vehicle only"; cars and vans can come with a driver. */
const NO_DRIVER_CATEGORIES: readonly VehicleCategory[] = ["125cc", "150cc"];

export function offersDriver(category: VehicleCategory): boolean {
  return !NO_DRIVER_CATEGORIES.includes(category);
}

export interface Quote {
  days: number;
  dailyRate: number;
  vehicleTotal: number;
  withDriver: boolean;
  /** The driver's daily rate this quote uses (0 for "Vehicle only"). */
  driverRate: number;
  driverTotal: number;
  total: number;
}

/** Total = (vehicle daily rate + driver daily rate, if chosen) × days. */
export function buildQuote({
  dailyRate,
  days,
  withDriver = false,
  driverRate = DRIVER_DAILY_RATE,
}: {
  dailyRate: number;
  days: number;
  withDriver?: boolean;
  driverRate?: number;
}): Quote {
  const vehicleTotal = dailyRate * days;
  const rate = withDriver ? driverRate : 0;
  const driverTotal = rate * days;
  return { days, dailyRate, vehicleTotal, withDriver, driverRate: rate, driverTotal, total: vehicleTotal + driverTotal };
}
