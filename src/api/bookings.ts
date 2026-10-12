import type { OnlinePaymentMethod, PaymentMethod } from "@/lib/constants";
import { canCustomerCancel, isPaymentOverdue } from "@/lib/booking-status";
import { buildQuote, offersDriver, splitDownPayment } from "@/lib/pricing";
import { countRentalDays } from "@/lib/rental";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Booking, BookingDocuments, Customer, Payment, Vehicle } from "@/types";
import { getCurrentAccount, saveSignedInDetails } from "./account";
import { ApiError, simulateNetwork } from "./client";
import { processPayment, type PaymentFailureCode, type PaymentRequest } from "./payments";

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

// No 0/O/1/I so references are easy to read out over the phone.
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReference(existing: Set<string>): string {
  let reference = "";
  do {
    reference =
      "RC-" +
      Array.from({ length: 6 }, () => REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)]).join("");
  } while (existing.has(reference));
  return reference;
}

/**
 * Sends a booking request. Nothing is charged: staff check the customer's documents first, and
 * once they approve them the customer pays with payForBooking. Booking is open: any vehicle can be
 * booked for any dates, so there is no availability check here.
 *
 * The price is worked out here from the vehicle's CURRENT rate (never trusted from the
 * browser), and stored on the booking. That price is locked: it is what the customer pays later,
 * even if the rate changes while they wait for approval.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  await simulateNetwork();

  const vehicles = readTable("vehicles");
  const vehicle = vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) throw new ApiError("Vehicle not found", 404, "not_found");

  const days = countRentalDays(input);
  const withDriver = input.withDriver && offersDriver(vehicle.category);
  const quote = buildQuote({ dailyRate: vehicle.pricePerDay, days, withDriver });

  // The visitor agreed to a specific total. If the vehicle's rate or the driver's rate changed since (both are
  // in the total), ask them to check again.
  if (input.expectedTotal !== quote.total) {
    throw new ApiError("The price has changed", 409, "price_changed");
  }

  const now = new Date().toISOString();
  const bookings = readTable("bookings");

  // Reuse the customer if this email is already known; otherwise create one.
  const customers = readTable("customers");
  const email = input.customer.email.trim().toLowerCase();
  let customer: Customer | undefined = customers.find((c) => c.email.toLowerCase() === email);
  if (customer) {
    customer = { ...customer, phone: input.customer.phone, licenseNumber: input.customer.licenseNumber };
    writeTable("customers", customers.map((c) => (c.id === customer!.id ? customer! : c)));
  } else {
    customer = {
      id: newId("cus"),
      name: input.customer.name,
      email,
      phone: input.customer.phone,
      licenseNumber: input.customer.licenseNumber,
      notes: "",
      additionalContacts: [],
      createdAt: now,
    };
    writeTable("customers", [customer, ...customers]);
  }

  const booking: Booking = {
    id: newId("bkg"),
    reference: generateReference(new Set(bookings.map((b) => b.reference))),
    customerId: customer.id,
    vehicleId: vehicle.id,
    pickupLocation: input.pickupLocation,
    returnLocation: input.returnLocation,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    returnDate: input.returnDate,
    returnTime: input.returnTime,
    days: quote.days,
    dailyRate: quote.dailyRate,
    vehicleTotal: quote.vehicleTotal,
    withDriver: quote.withDriver,
    driverRate: quote.driverRate,
    driverTotal: quote.driverTotal,
    total: quote.total,
    status: "pending",
    // FILE STORAGE GOES HERE: a real backend uploads these to PRIVATE storage that only staff can
    // read (signed, expiring links) and stores only the file keys on the booking.
    documents: input.documents,
    documentsStatus: "pending",
    rejectionReason: null,
    approvedAt: null,
    paymentId: null,
    notes: input.customer.notes,
    createdAt: now,
    updatedAt: now,
  };

  writeTable("bookings", [booking, ...bookings]);
  writeTable("activities", [
    customerActivity(customer.id, `Booking request ${booking.reference} sent online for ${vehicle.name}.`, now),
    ...readTable("activities"),
  ]);

  // EMAIL TRIGGER GOES HERE: send requestReceivedEmail to the customer and staffNewRequestEmail
  // to the company inbox (templates in /src/emails; toEmailBooking builds their input).

  saveSignedInDetails(input.customer);

  return booking;
}

const customerActivity = (customerId: string, body: string, createdAt: string): Activity => ({
  id: newId("act"),
  type: "note",
  body,
  entityType: "customer",
  entityId: customerId,
  authorId: null,
  createdAt,
});

/**
 * The signed-in customer's bookings (those made with their account's email), newest first.
 * ID photos are left out. Empty when nobody is signed in.
 */
export async function listOwnBookings(): Promise<BookingDetails[]> {
  await simulateNetwork();
  const account = await getCurrentAccount();
  if (!account) return [];
  const email = account.email.toLowerCase();
  const customerIds = new Set(
    readTable("customers")
      .filter((c) => c.email.toLowerCase() === email)
      .map((c) => c.id),
  );
  return readTable("bookings")
    .filter((b) => customerIds.has(b.customerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((b) => toBookingDetails({ ...b, documents: null }))
    .filter((details): details is BookingDetails => details !== null);
}

/** Finds a booking by reference, but only for the person who made it (their email must match). */
function findOwnBooking(reference: string, email: string): Booking {
  const booking = readTable("bookings").find((b) => b.reference.toLowerCase() === reference.trim().toLowerCase());
  const customer = booking && readTable("customers").find((c) => c.id === booking.customerId);
  // The same answer whether the reference or the email is wrong, so nobody can probe for bookings.
  if (!booking || !customer || customer.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new ApiError("Booking not found", 404, "not_found");
  }
  return booking;
}

/**
 * The customer's own booking, for the pay and new-photos pages. The email is the proof of
 * ownership here; a real backend would put a signed, expiring token in the emailed link instead.
 */
export async function getOwnBooking(reference: string, email: string): Promise<BookingDetails> {
  await simulateNetwork();
  const details = toBookingDetails({ ...findOwnBooking(reference, email), documents: null });
  if (!details) throw new ApiError("Booking not found", 404, "not_found");
  return details;
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
 * Pays for a booking whose documents staff have approved, at the price locked when it was
 * requested, and confirms it. Only possible before the payment deadline.
 */
export async function payForBooking(input: PayForBookingInput): Promise<PayForBookingResult> {
  await simulateNetwork();

  const existing = findOwnBooking(input.reference, input.email);
  if (existing.status !== "approved") throw new ApiError("This booking cannot be paid", 409, "not_payable");
  if (isPaymentOverdue(existing)) throw new ApiError("The payment deadline has passed", 409, "payment_overdue");

  // Pay at pick-up: only the down payment is charged now; the balance is paid at pick-up.
  const payAtPickup = input.method === "pay_at_pickup";
  const downPaymentMethod = input.downPaymentMethod ?? "card";
  const { downPayment } = splitDownPayment(existing.total);
  const payment = await processPayment({
    method: payAtPickup ? downPaymentMethod : (input.method as OnlinePaymentMethod),
    amount: payAtPickup ? downPayment : existing.total,
    mockOutcome: input.mockOutcome,
  });
  if (payment.status === "failed") {
    return { status: "payment_failed", failureCode: payment.failureCode ?? "declined" };
  }

  const now = new Date().toISOString();
  const paymentRecord: Payment = {
    id: newId("pay"),
    bookingId: existing.id,
    method: input.method,
    amount: existing.total,
    status: payAtPickup ? "pending" : "paid",
    providerRef: payment.providerRef,
    downPayment: payAtPickup ? { method: downPaymentMethod, amount: downPayment } : null,
    createdAt: now,
  };
  const booking: Booking = { ...existing, status: "confirmed", paymentId: paymentRecord.id, updatedAt: now };

  // Read again: taking the payment takes a moment, and other changes may have been saved meanwhile.
  writeTable("bookings", readTable("bookings").map((b) => (b.id === booking.id ? booking : b)));
  writeTable("payments", [paymentRecord, ...readTable("payments")]);
  writeTable("activities", [
    customerActivity(booking.customerId, `Booking ${booking.reference} paid online and confirmed.`, now),
    ...readTable("activities"),
  ]);

  // EMAIL TRIGGER GOES HERE: send bookingConfirmedEmail to the customer (/src/emails).

  return { status: "paid", booking };
}

/**
 * The customer cancels their own booking, giving a reason. Only allowed while nothing has been
 * paid (see canCustomerCancel), since there is no refund policy.
 */
export async function cancelOwnBooking(reference: string, email: string, reason: string): Promise<Booking> {
  await simulateNetwork();

  const existing = findOwnBooking(reference, email);
  if (!canCustomerCancel(existing)) {
    throw new ApiError("This booking can no longer be cancelled online", 409, "not_cancellable");
  }

  const now = new Date().toISOString();
  const booking: Booking = {
    ...existing,
    status: "cancelled",
    cancellation: { by: "customer", reason: reason.trim(), at: now },
    updatedAt: now,
  };
  writeTable("bookings", readTable("bookings").map((b) => (b.id === booking.id ? booking : b)));
  writeTable("activities", [
    customerActivity(booking.customerId, `Booking ${booking.reference} cancelled by the customer. Reason: ${reason.trim()}`, now),
    ...readTable("activities"),
  ]);

  // EMAIL TRIGGER GOES HERE: tell the company inbox the customer cancelled, with their reason.

  return booking;
}

/** Sends new document photos after staff rejected the first ones. They go back to staff to check. */
export async function resubmitDocuments(reference: string, email: string, documents: BookingDocuments): Promise<Booking> {
  await simulateNetwork();

  const existing = findOwnBooking(reference, email);
  if (existing.status !== "pending" || existing.documentsStatus !== "rejected") {
    throw new ApiError("New documents are not needed for this booking", 409, "not_resubmittable");
  }

  const now = new Date().toISOString();
  const booking: Booking = { ...existing, documents, documentsStatus: "pending", rejectionReason: null, updatedAt: now };
  writeTable("bookings", readTable("bookings").map((b) => (b.id === booking.id ? booking : b)));
  writeTable("activities", [
    customerActivity(booking.customerId, `New documents sent for booking ${booking.reference}.`, now),
    ...readTable("activities"),
  ]);

  // EMAIL TRIGGER GOES HERE: send staffNewRequestEmail (with resent: true) to the company inbox (/src/emails).

  return booking;
}

export interface BookingDetails {
  booking: Booking;
  vehicle: Vehicle;
  customer: Customer;
  payment: Payment | null;
}

/**
 * Looks up a booking by its reference for the status page (shown right after sending the request).
 * It shows no ID photos and allows no changes; paying and sending new photos also need the email.
 */
export async function getBookingByReference(reference: string): Promise<BookingDetails | null> {
  await simulateNetwork();
  const booking = readTable("bookings").find((b) => b.reference.toLowerCase() === reference.toLowerCase());
  // The customer's ID photos are for staff only; the public confirmation page never receives them.
  return booking ? toBookingDetails({ ...booking, documents: null }) : null;
}

/** Joins a booking with its vehicle, customer and payment. Shared with the admin screens. */
export function toBookingDetails(booking: Booking): BookingDetails | null {
  const vehicle = readTable("vehicles").find((v) => v.id === booking.vehicleId);
  const customer = readTable("customers").find((c) => c.id === booking.customerId);
  if (!vehicle || !customer) return null;

  return {
    booking,
    vehicle,
    customer,
    payment: readTable("payments").find((p) => p.id === booking.paymentId) ?? null,
  };
}
