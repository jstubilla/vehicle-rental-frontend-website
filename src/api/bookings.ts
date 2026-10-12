import type { OnlinePaymentMethod, PaymentMethod } from "@/lib/constants";
import { buildQuote, offersDriver, splitDownPayment } from "@/lib/pricing";
import { countRentalDays } from "@/lib/rental";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Booking, BookingDocuments, Customer, Payment, Vehicle } from "@/types";
import { saveSignedInDetails } from "./account";
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
  /**
   * How the visitor chose to pay. The charge happens inside createBooking, see /src/api/payments.ts.
   * "Pay at pick-up" charges the down payment now with `downPaymentMethod`.
   */
  payment: {
    method: PaymentMethod;
    downPaymentMethod?: OnlinePaymentMethod;
    mockOutcome?: PaymentRequest["mockOutcome"];
  };
  /** The total the visitor was shown. If the price is different now, nothing is charged. */
  expectedTotal: number;
}

export type CreateBookingResult =
  | { status: "confirmed"; booking: Booking }
  /** The payment did not go through. Nothing was booked. */
  | { status: "payment_failed"; failureCode: PaymentFailureCode };

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
 * Pays and books in one action. The price is checked first, then the payment is taken, then
 * the booking is saved, so nobody is charged for a booking that does not go through. (A real
 * server does all three inside one database transaction.) Booking is open: any vehicle can be
 * booked for any dates, so there is no availability check here.
 *
 * The price is worked out here from the vehicle's CURRENT rate (never trusted from the
 * browser), and stored on the booking so later rate changes do not affect it.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  await simulateNetwork();

  const vehicles = readTable("vehicles");
  const vehicle = vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) throw new ApiError("Vehicle not found", 404, "not_found");

  const days = countRentalDays(input);
  const withDriver = input.withDriver && offersDriver(vehicle.category);
  const quote = buildQuote({ dailyRate: vehicle.pricePerDay, days, withDriver });

  // The visitor agreed to a specific total. If the vehicle's rate or the driver's rate changed since (both are
  // in the total), ask them to check again, before charging anything.
  if (input.expectedTotal !== quote.total) {
    throw new ApiError("The price has changed", 409, "price_changed");
  }

  // Pay at pick-up: only the down payment is charged now; the balance is paid at pick-up.
  const payAtPickup = input.payment.method === "pay_at_pickup";
  const downPaymentMethod = input.payment.downPaymentMethod ?? "card";
  const { downPayment } = splitDownPayment(quote.total);
  const payment = await processPayment({
    method: payAtPickup ? downPaymentMethod : (input.payment.method as OnlinePaymentMethod),
    amount: payAtPickup ? downPayment : quote.total,
    mockOutcome: input.payment.mockOutcome,
  });
  if (payment.status === "failed") {
    return { status: "payment_failed", failureCode: payment.failureCode ?? "declined" };
  }

  const now = new Date().toISOString();
  // Read again: taking the payment takes a moment, and other bookings may have been saved meanwhile.
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

  const bookingId = newId("bkg");
  const paymentId = newId("pay");
  const paymentRecord: Payment = {
    id: paymentId,
    bookingId,
    method: input.payment.method,
    amount: quote.total,
    status: payAtPickup ? "pending" : "paid",
    providerRef: payment.providerRef,
    downPayment: payAtPickup ? { method: downPaymentMethod, amount: downPayment } : null,
    createdAt: now,
  };

  const booking: Booking = {
    id: bookingId,
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
    // Paid (in full or by down payment), but staff check the customer's documents before confirming.
    status: "pending",
    // FILE STORAGE GOES HERE: a real backend uploads these to PRIVATE storage that only staff can
    // read (signed, expiring links) and stores only the file keys on the booking.
    documents: input.documents,
    documentsStatus: "pending",
    paymentId,
    notes: input.customer.notes,
    createdAt: now,
    updatedAt: now,
  };

  const activity: Activity = {
    id: newId("act"),
    type: "note",
    body: `Booking ${booking.reference} created online for ${vehicle.name}.`,
    entityType: "customer",
    entityId: customer.id,
    authorId: null,
    createdAt: now,
  };

  writeTable("bookings", [booking, ...bookings]);
  writeTable("payments", [paymentRecord, ...readTable("payments")]);
  writeTable("activities", [activity, ...readTable("activities")]);

  // EMAIL TRIGGER GOES HERE: when the real backend exists, send the booking
  // confirmation to the customer and a notification to the company inbox.

  saveSignedInDetails(input.customer);

  return { status: "confirmed", booking };
}

export interface BookingDetails {
  booking: Booking;
  vehicle: Vehicle;
  customer: Customer;
  payment: Payment | null;
}

/**
 * Looks up a booking by its reference for the confirmation page.
 * A real API should also require proof of ownership (e.g. the email address or a token).
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
