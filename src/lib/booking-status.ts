import type { BookingStatus } from "./constants";

/**
 * The statuses staff can move a booking to with the status buttons. "Approved" is reached only by
 * approving the customer's documents, and a booking never goes back to pending.
 */
export type NextBookingStatus = Exclude<BookingStatus, "pending" | "approved">;

/**
 * Which status a booking may move to next. Pending, approved and confirmed bookings can be
 * cancelled; once a rental is active it can only be completed. Completed and cancelled bookings
 * are final. A booking with documents reaches "confirmed" only when the customer pays (see
 * api/bookings.ts); staff confirm by hand only older bookings that have no documents.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly NextBookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  approved: ["cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  cancelled: [],
};

/** Once staff approve the documents, the customer has this long to pay before the booking is cancelled. */
export const PAYMENT_DEADLINE_HOURS = 24;

/** When an approved booking must be paid by (ISO), or null if it was never approved. */
export function paymentDeadline(booking: { approvedAt?: string | null }): string | null {
  if (!booking.approvedAt) return null;
  return new Date(new Date(booking.approvedAt).getTime() + PAYMENT_DEADLINE_HOURS * 3_600_000).toISOString();
}

export function isPaymentOverdue(booking: { approvedAt?: string | null }, now = new Date()): boolean {
  const deadline = paymentDeadline(booking);
  return deadline !== null && now.getTime() > new Date(deadline).getTime();
}

/** A booking request whose photos staff still have to approve or reject. */
export function isWaitingForDocumentCheck(booking: { status: BookingStatus; documentsStatus?: string | null; documents?: unknown }): boolean {
  return booking.status === "pending" && Boolean(booking.documents) && booking.documentsStatus === "pending";
}

/**
 * Customers may cancel a booking themselves only while nothing has been paid: there is no
 * refund policy, so once paid, only staff can cancel it.
 */
export function canCustomerCancel(booking: { status: BookingStatus; paymentId: string | null }): boolean {
  return (booking.status === "pending" || booking.status === "approved") && booking.paymentId === null;
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return (BOOKING_TRANSITIONS[from] as readonly BookingStatus[]).includes(to);
}
