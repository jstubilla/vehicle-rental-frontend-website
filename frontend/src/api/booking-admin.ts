import { content } from "@/content";
import { canTransition } from "@/lib/booking-status";
import { searchBookings, type BookingListParams, type BookingRow as BookingListRow } from "@/lib/booking-search";
import type { ActivityType, BookingStatus, DocumentKind } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { Booking, BookingDocuments, Paginated, Payment } from "@/types";
import { requireStaff } from "./auth";
import type { BookingDetails } from "./bookings";
import { ApiError, check, toApiError, unwrap } from "./client";
import {
  one,
  toBooking,
  toCustomer,
  toPayment,
  toVehicle,
  type BookingRow,
  type CustomerRow,
  type PaymentRow,
  type VehicleRow,
} from "./rows";
import { db, DOCUMENTS_BUCKET } from "./supabase";

/**
 * Staff-side booking management. (Visitors create bookings in api/bookings.ts.) The database enforces
 * the status flow and the locked price; these functions add the activity notes.
 */

/** How long a link to a customer's document photo works. */
const SIGNED_URL_SECONDS = 10 * 60;

export async function listBookings(params: BookingListParams): Promise<Paginated<BookingListRow>> {
  await requireStaff();
  const rows = unwrap(
    await db().from("bookings").select("*, customer:customers(name), vehicle:vehicles(name), payment:payments(id, status)"),
  ) as (BookingRow & {
    customer: { name: string } | null;
    vehicle: { name: string } | null;
    payment: { id: string; status: Payment["status"] } | { id: string; status: Payment["status"] }[] | null;
  })[];
  return searchBookings(
    rows.map(({ customer, vehicle, payment, ...row }) => {
      const paid = one(payment);
      return {
        ...toBooking(row, paid?.id ?? null),
        customerName: customer?.name ?? "",
        vehicleName: vehicle?.name ?? "",
        paymentStatus: paid?.status ?? null,
      };
    }),
    params,
  );
}

/** The customer's document photos, as short-lived private links only staff can create. */
async function loadDocuments(bookingId: string): Promise<BookingDocuments | null> {
  const rows = unwrap(
    await db().from("booking_documents").select("kind, storage_path, file_name").eq("booking_id", bookingId),
  ) as { kind: DocumentKind; storage_path: string; file_name: string }[];
  if (rows.length === 0) return null;
  const signed = unwrap(
    await db()
      .storage.from(DOCUMENTS_BUCKET)
      .createSignedUrls(
        rows.map((row) => row.storage_path),
        SIGNED_URL_SECONDS,
      ),
  );
  const urls = new Map(signed.map((item) => [item.path, item.signedUrl]));
  return Object.fromEntries(
    rows.map((row) => [row.kind, { fileName: row.file_name, dataUrl: urls.get(row.storage_path) ?? "" }]),
  ) as BookingDocuments;
}

export async function getBookingById(id: string): Promise<BookingDetails | null> {
  await requireStaff();
  const { data, error } = await db()
    .from("bookings")
    .select("*, vehicle:vehicles(*), customer:customers(*, contact_details(*)), payment:payments(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!data) return null;
  const { vehicle, customer, payment, ...row } = data as BookingRow & {
    vehicle: VehicleRow;
    customer: CustomerRow;
    payment: PaymentRow | PaymentRow[] | null;
  };
  const paymentRow = one(payment);
  return {
    booking: { ...toBooking(row, paymentRow?.id ?? null), documents: await loadDocuments(id) },
    vehicle: toVehicle(vehicle),
    customer: toCustomer(customer),
    payment: paymentRow ? toPayment(paymentRow) : null,
  };
}

async function addCustomerNote(customerId: string, type: ActivityType, body: string, authorId: string) {
  check(await db().from("activities").insert({ type, body, customer_id: customerId, author_id: authorId }));
}

async function loadBooking(id: string): Promise<BookingRow> {
  return unwrap(await db().from("bookings").select("*").eq("id", id).maybeSingle()) as BookingRow;
}

/** Moves a booking to its next status, if the rules allow it, and logs it on the customer. */
export async function changeBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const { userId } = await requireStaff();
  const existing = await loadBooking(id);
  if (!canTransition(existing.status, status)) {
    throw new ApiError("That status change is not allowed", 409, "invalid_transition");
  }
  // The database also refuses to confirm a booking with documents by hand: the customer's payment does that.
  const updated = unwrap(await db().from("bookings").update({ status }).eq("id", id).select("*").single()) as BookingRow;
  await addCustomerNote(
    existing.customer_id,
    "status_change",
    content.admin.bookings.statusChangeNote(
      existing.reference,
      content.enums.bookingStatus[existing.status],
      content.enums.bookingStatus[status],
    ),
    userId,
  );
  return toBooking(updated, null);
}

/**
 * Records the staff decision on the customer's documents. Approving them moves the booking to
 * "approved" (the database does this), and the customer is sent a link to pay. Rejecting them (with a
 * reason the customer sees) leaves it pending until the customer sends new photos.
 */
export async function reviewBookingDocuments(id: string, decision: "verified" | "rejected", reason = ""): Promise<Booking> {
  const { userId } = await requireStaff();
  const existing = await loadBooking(id);
  if (existing.status !== "pending" || existing.documents_status !== "pending") {
    throw new ApiError("These documents have already been checked", 409, "invalid_transition");
  }
  const updated = unwrap(
    await db()
      .from("bookings")
      .update({ documents_status: decision, rejection_reason: decision === "rejected" ? reason.trim() : null })
      .eq("id", id)
      .select("*")
      .single(),
  ) as BookingRow;
  await addCustomerNote(existing.customer_id, "note", content.admin.bookings.documentsNote(existing.reference, decision), userId);
  // EMAIL TRIGGER GOES HERE: approved = send documentsApprovedEmail (the link to pay); rejected =
  // send documentsRejectedEmail (the reason and the link to send new photos). Templates: /src/emails.
  return toBooking(updated, null);
}

/** Records that the customer has paid the balance (used for pay-at-pick-up bookings). */
export async function markPaymentReceived(bookingId: string): Promise<Payment> {
  const { userId } = await requireStaff();
  const booking = await loadBooking(bookingId);
  const updated = unwrap(
    await db().from("payments").update({ status: "paid" }).eq("booking_id", bookingId).select("*").maybeSingle(),
  ) as PaymentRow;
  const payment = toPayment(updated);
  await addCustomerNote(
    booking.customer_id,
    "note",
    content.admin.bookings.paymentNote(
      booking.reference,
      formatCurrency(payment.amount - (payment.downPayment?.amount ?? 0)),
      content.enums.paymentMethod[payment.method],
    ),
    userId,
  );
  return payment;
}
