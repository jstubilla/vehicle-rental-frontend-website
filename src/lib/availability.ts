import { VEHICLE_HOLDING_STATUSES } from "./constants";
import { toTimestamp } from "./dates";
import type { Booking, Vehicle } from "@/types";

export interface DateRange {
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

/** Two rentals clash if each one starts before the other ends. Back-to-back is fine. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  const aStart = toTimestamp(a.pickupDate, a.pickupTime);
  const aEnd = toTimestamp(a.returnDate, a.returnTime);
  const bStart = toTimestamp(b.pickupDate, b.pickupTime);
  const bEnd = toTimestamp(b.returnDate, b.returnTime);
  return aStart < bEnd && bStart < aEnd;
}

/**
 * A vehicle can be booked if it is in service and no active booking holds it
 * during the requested dates. Cancelled and completed bookings do not count.
 */
export function isVehicleAvailable(vehicle: Vehicle, bookings: Booking[], range: DateRange): boolean {
  if (vehicle.status !== "available") return false;
  return !bookings.some(
    (booking) =>
      booking.vehicleId === vehicle.id &&
      VEHICLE_HOLDING_STATUSES.includes(booking.status) &&
      rangesOverlap(booking, range),
  );
}
