import { DOCUMENT_KINDS, type OnlinePaymentMethod, type PaymentMethod } from "@/lib/constants";
import type { Booking, BookingDocuments, Customer, Payment, Vehicle } from "@/types";
import { ApiError, toApiError, unwrap } from "./client";
import type { PaymentFailureCode, PaymentRequest } from "./payments";
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
 * Bookings, from the visitor's side. Prices, references, the customer record and every rule are
 * handled by the database functions (backend/supabase/migrations/…_public_functions.sql); this file
 * uploads the photos and converts the results.
 */

export interface CreateBookingInput {
  vehicleId: string;
  /** Wherever the visitor typed or pasted (an address, or a Google Maps link). */
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  /** "With a driver". Ignored for a vehicle that does not offer one (motorcycles). */
  withDriver: boolean;
  customer: { name: string; email: string; phone: string; licenseNumber: string; notes: string };
  /** Photos of the customer's valid ID, proof of billing and driver's license, for staff to check. */
  documents: BookingDocuments;
  /** The total the visitor was shown. If the price is different now, nothing is booked. */
  expectedTotal: number;
}

export interface BookingDetails {
  booking: Booking;
  vehicle: Vehicle;
  customer: Customer;
  payment: Payment | null;
}

/** What the booking functions in the database return. */
interface BookingDetailsJson {
  booking: BookingRow;
  vehicle: VehicleRow;
  /** Only { id, name } on the public status page. */
  customer: Partial<CustomerRow> & Pick<CustomerRow, "id" | "name">;
  payment: PaymentRow | null;
}

function fromJson(json: BookingDetailsJson): BookingDetails {
  const payment = json.payment ? toPayment(json.payment) : null;
  return {
    booking: toBooking(json.booking, payment?.id ?? null),
    vehicle: toVehicle(json.vehicle),
    customer: toCustomer({
      email: "",
      phone: "",
      license_number: null,
      notes: "",
      created_at: json.booking.created_at,
      ...json.customer,
    }),
    payment,
  };
}

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Uploads the three photos to the private documents bucket, in a new random folder. Visitors may add
 * files there but never read them back; the database checks they exist when the booking is sent.
 */
async function uploadDocuments(documents: BookingDocuments) {
  const folder = crypto.randomUUID();
  const uploaded: Record<string, { path: string; fileName: string }> = {};
  for (const kind of DOCUMENT_KINDS) {
    const { dataUrl, fileName } = documents[kind];
    const blob = await (await fetch(dataUrl)).blob();
    const path = `uploads/${folder}/${kind}.${EXTENSIONS[blob.type] ?? "jpg"}`;
    const { error } = await db().storage.from(DOCUMENTS_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    if (error) throw new ApiError(`Could not upload the ${kind} photo: ${error.message}`, 500, "unknown");
    uploaded[kind] = { path, fileName };
  }
  return uploaded;
}

/**
 * Sends a booking request. Nothing is charged: staff check the customer's documents first, and once
 * they approve them the customer pays with payForBooking. Booking is open: any vehicle can be booked
 * for any dates, so there is no availability check.
 *
 * The database works out the price from the vehicle's CURRENT rate (never trusted from the browser)
 * and locks it on the booking. If it differs from expectedTotal, nothing is booked ("price_changed").
 * A signed-in customer's phone and license are saved to their account for next time.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingDetails> {
  const documents = await uploadDocuments(input.documents);
  const json = unwrap(
    await db().rpc("create_booking_request", {
      vehicle_id: input.vehicleId,
      pickup_location: input.pickupLocation,
      return_location: input.returnLocation,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      return_date: input.returnDate,
      return_time: input.returnTime,
      with_driver: input.withDriver,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
      license_number: input.customer.licenseNumber,
      notes: input.customer.notes,
      documents,
      expected_total: input.expectedTotal,
    }),
  ) as BookingDetailsJson;
  // EMAIL TRIGGER GOES HERE: requestReceivedEmail to the customer and staffNewRequestEmail to the
  // company inbox (templates in /src/emails), e.g. from a Supabase database webhook on new bookings.
  return fromJson(json);
}

/**
 * The signed-in customer's bookings (those made with their account's confirmed email), newest first.
 * The database only returns their own.
 */
export async function listOwnBookings(): Promise<BookingDetails[]> {
  const supabase = db();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];
  const rows = unwrap(
    await supabase
      .from("bookings")
      .select("*, vehicle:vehicles(*), customer:customers(*), payment:payments(*)")
      .order("created_at", { ascending: false }),
  ) as (BookingRow & { vehicle: VehicleRow | null; customer: CustomerRow | null; payment: PaymentRow | PaymentRow[] | null })[];
  return rows.flatMap(({ vehicle, customer, payment, ...booking }) => {
    if (!vehicle || !customer) return [];
    const paymentRow = one(payment);
    return [{ booking, vehicle, customer, payment: paymentRow } as BookingDetailsJson].map(fromJson);
  });
}

/**
 * The customer's own booking, for the pay and new-photos pages. The email is the proof of ownership
 * (the same "not_found" whether the reference or the email is wrong). ID photos are never included.
 */
export async function getOwnBooking(reference: string, email: string): Promise<BookingDetails> {
  return fromJson(unwrap(await db().rpc("get_own_booking", { reference, email })) as BookingDetailsJson);
}

export interface PayForBookingInput {
  reference: string;
  email: string;
  /** "Pay at pick-up" charges the down payment now with `downPaymentMethod`. */
  method: PaymentMethod;
  downPaymentMethod?: OnlinePaymentMethod;
  mockOutcome?: PaymentRequest["mockOutcome"];
}

export type PayForBookingResult =
  | { status: "paid"; booking: Booking }
  /** The payment did not go through. The booking is still waiting for payment. */
  | { status: "payment_failed"; failureCode: PaymentFailureCode };

/**
 * Pays for a booking whose documents staff have approved, at the price locked when it was requested,
 * and confirms it. Runs on the server (src/app/api/payments/route.ts): the payment is taken there and
 * recorded with a key the browser never sees.
 */
export async function payForBooking(input: PayForBookingInput): Promise<PayForBookingResult> {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as
    | { status: "paid"; booking: BookingDetailsJson }
    | { status: "payment_failed"; failureCode: PaymentFailureCode }
    | { error: { message: string; code: ApiError["code"] } }
    | null;
  if (!body || "error" in body) {
    throw new ApiError(body?.error.message ?? "Payment failed", response.status, body?.error.code ?? "unknown");
  }
  if (body.status === "payment_failed") return body;
  return { status: "paid", booking: fromJson(body.booking).booking };
}

/**
 * The customer cancels their own booking, giving a reason. Only allowed while nothing has been paid,
 * since there is no refund policy ("not_cancellable" otherwise).
 */
export async function cancelOwnBooking(reference: string, email: string, reason: string): Promise<Booking> {
  const json = unwrap(await db().rpc("cancel_own_booking", { reference, email, reason })) as BookingDetailsJson;
  // EMAIL TRIGGER GOES HERE: tell the company inbox the customer cancelled, with their reason.
  return fromJson(json).booking;
}

/** Sends new document photos after staff rejected the first ones. They go back to staff to check. */
export async function resubmitDocuments(reference: string, email: string, documents: BookingDocuments): Promise<Booking> {
  const uploaded = await uploadDocuments(documents);
  const json = unwrap(await db().rpc("resubmit_documents", { reference, email, documents: uploaded })) as BookingDetailsJson;
  // EMAIL TRIGGER GOES HERE: send staffNewRequestEmail (with resent: true) to the company inbox.
  return fromJson(json).booking;
}

/**
 * Looks up a booking by its reference for the status page (shown right after sending the request).
 * Anyone with the reference can open it, so the customer is reduced to their name; it shows no ID
 * photos and allows no changes. Paying and sending new photos also need the email.
 */
export async function getBookingByReference(reference: string): Promise<BookingDetails | null> {
  const { data, error } = await db().rpc("get_booking_by_reference", { reference });
  if (error) throw toApiError(error);
  return data ? fromJson(data as BookingDetailsJson) : null;
}
