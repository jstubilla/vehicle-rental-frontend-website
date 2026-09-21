import { content } from "@/content";
import { canTransition } from "@/lib/booking-status";
import { searchBookings, type BookingListParams, type BookingRow } from "@/lib/booking-search";
import type { BookingStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Booking, Paginated, Payment } from "@/types";
import { assertCan } from "./auth";
import { toBookingDetails, type BookingDetails } from "./bookings";
import { ApiError, simulateNetwork } from "./client";

/** Staff-side booking management. (Visitors create bookings in api/bookings.ts.) */

export async function listBookings(params: BookingListParams): Promise<Paginated<BookingRow>> {
  assertCan("bookings.view");
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
  assertCan("bookings.view");
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
  const session = assertCan("bookings.edit");
  await simulateNetwork();

  const bookings = readTable("bookings");
  const existing = bookings.find((b) => b.id === id);
  if (!existing) throw new ApiError("Booking not found", 404, "not_found");
  if (!canTransition(existing.status, status)) {
    throw new ApiError("That status change is not allowed", 409, "invalid_transition");
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

/** Records that the customer has paid (used for pay-at-pick-up bookings). */
export async function markPaymentReceived(bookingId: string): Promise<Payment> {
  const session = assertCan("bookings.edit");
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
        formatCurrency(payment.amount),
        content.enums.paymentMethod[payment.method],
      ),
      session.userId,
    ),
    ...readTable("activities"),
  ]);
  return updated;
}
