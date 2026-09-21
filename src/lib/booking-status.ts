import type { BookingStatus } from "./constants";

/** A booking never goes back to pending, so pending is never a "next" status. */
export type NextBookingStatus = Exclude<BookingStatus, "pending">;

/**
 * Which status a booking may move to next. Pending and confirmed bookings can be
 * cancelled; once a rental is active it can only be completed. Completed and
 * cancelled bookings are final.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly NextBookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return (BOOKING_TRANSITIONS[from] as readonly BookingStatus[]).includes(to);
}
