import { content } from "@/content";
import { canTransition } from "@/lib/booking-status";
import { searchBookings, type BookingListParams, type BookingRow } from "@/lib/booking-search";
import type { BookingStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Booking, Paginated, Payment } from "@/types";
import { assertAdmin } from "./auth";
import { toBookingDetails, type BookingDetails } from "./bookings";
import { ApiError, simulateNetwork } from "./client";

/** Staff-side booking management. (Visitors create bookings in api/bookings.ts.) */

export async function listBookings(params: BookingListParams): Promise<Paginated<BookingRow>> {
  assertAdmin();
  await simulateNetwork();

  const customers = readTable("customers");
  const vehicles = readTable("vehicles");
  const payments = readTable("payments");
  const rows: BookingRow[] = readTable("bookings").map((booking) => ({
    ...booking,
    customerName: customers.find((c) => c.id === booking.customerId)?.name ?? "",
    vehicleName: vehicles.find((v) => v.id === booking.vehicleId)?.name ?? "",
    paymentStatus: payments.find((p) => p.id === booking.paymentId)?.status ?? null,
  }));
  return searchBookings(rows, params);
}

export async function getBookingById(id: string): Promise<BookingDetails | null> {
  assertAdmin();
  await simulateNetwork();
  const booking = readTable("bookings").find((b) => b.id === id);
  return booking ? toBookingDetails(booking) : null;
}

const customerNote = (customerId: string, type: Activity["type"], body: string, authorId: string): Activity => ({
  id: newId("act"),
  type,
  body,
  entityType: "customer",
  entityId: customerId,
  authorId,
  createdAt: new Date().toISOString(),
});

/** Moves a booking to its next status, if the rules allow it, and logs it on the customer. */
export async function changeBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const session = assertAdmin();
  await simulateNetwork();

  const bookings = readTable("bookings");
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new ApiError("Booking not found", 404, "not_found");
  if (!canTransition(existing.status, status)) {
    throw new ApiError("That status change is not allowed", 409, "invalid_transition");
  }
  // A booking with documents is confirmed only by the customer paying, after staff approve them.
  if (status === "confirmed" && existing.documents) {
    throw new ApiError("This booking is confirmed when the customer pays", 409, "invalid_transition");
  }

  const updated: Booking = { ...existing, status, updatedAt: new Date().toISOString() };
  writeTable("bookings", bookings.map((b) => (b.id === id ? updated : b)));
  writeTable("activities", [
    customerNote(
      existing.customerId,
      "status_change",
      content.admin.bookings.statusChangeNote(
        existing.reference,
        content.enums.bookingStatus[existing.status],
        content.enums.bookingStatus[status],
      ),
      session.userId,
    ),
    ...readTable("activities"),
  ]);
  return updated;
}

/**
 * Records the staff decision on the customer's documents. Approving them moves the booking to
 * "approved", and the customer is sent a link to pay. Rejecting them (with a reason the customer
 * sees) leaves it pending until the customer sends new photos.
 */
export async function reviewBookingDocuments(
  id: string,
  decision: "verified" | "rejected",
  reason = "",
): Promise<Booking> {
  const session = assertAdmin();
  await simulateNetwork();

  const bookings = readTable("bookings");
  const existing = bookings.find((b) => b.id === id);
  if (!existing || !existing.documents) throw new ApiError("Booking not found", 404, "not_found");
  if (existing.status !== "pending" || existing.documentsStatus !== "pending") {
    throw new ApiError("These documents have already been checked", 409, "invalid_transition");
  }

  const now = new Date().toISOString();
  const updated: Booking = {
    ...existing,
    documentsStatus: decision,
    status: decision === "verified" ? "approved" : "pending",
    approvedAt: decision === "verified" ? now : null,
    rejectionReason: decision === "rejected" ? reason.trim() : null,
    updatedAt: now,
  };
  writeTable("bookings", bookings.map((b) => (b.id === id ? updated : b)));
  writeTable("activities", [
    customerNote(existing.customerId, "note", content.admin.bookings.documentsNote(existing.reference, decision), session.userId),
    ...readTable("activities"),
  ]);
  // EMAIL TRIGGER GOES HERE: approved = send documentsApprovedEmail (the link to pay); rejected =
  // send documentsRejectedEmail (the reason and the link to send new photos). Templates: /src/emails.
  // A scheduled job on the backend should also send paymentReminderEmail a few hours before the
  // payment deadline, and cancel bookings still unpaid after it.
  return updated;
}

/** Records that the customer has paid (used for pay-at-pick-up bookings). */
export async function markPaymentReceived(bookingId: string): Promise<Payment> {
  const session = assertAdmin();
  await simulateNetwork();

  const booking = readTable("bookings").find((b) => b.id === bookingId);
  const payments = readTable("payments");
  const payment = payments.find((p) => p.id === booking?.paymentId);
  if (!booking || !payment) throw new ApiError("Payment not found", 404, "not_found");

  const updated: Payment = { ...payment, status: "paid" };
  writeTable("payments", payments.map((p) => (p.id === payment.id ? updated : p)));
  writeTable("activities", [
    customerNote(
      booking.customerId,
      "note",
      content.admin.bookings.paymentNote(
        booking.reference,
        formatCurrency(payment.amount - (payment.downPayment?.amount ?? 0)),
        content.enums.paymentMethod[payment.method],
      ),
      session.userId,
    ),
    ...readTable("activities"),
  ]);
  return updated;
}
