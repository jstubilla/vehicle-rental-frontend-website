import { isVehicleAvailable, type DateRange } from "@/lib/availability";
import { buildQuote } from "@/lib/pricing";
import { countRentalDays } from "@/lib/rental";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Booking, Customer, Location, Payment, Vehicle } from "@/types";
import { ApiError, simulateNetwork } from "./client";
import type { PaymentResult } from "./payments";

export interface VehicleAvailability {
  vehicle: Vehicle;
  available: boolean;
}

/** Every public vehicle, flagged with whether it is free for the requested dates. */
export async function listVehiclesWithAvailability(range: DateRange): Promise<VehicleAvailability[]> {
  await simulateNetwork();
  const bookings = readTable("bookings");
  return readTable("vehicles")
    .filter((vehicle) => vehicle.status !== "inactive")
    .map((vehicle) => ({ vehicle, available: isVehicleAvailable(vehicle, bookings, range) }))
    .sort((a, b) => a.vehicle.pricePerDay - b.vehicle.pricePerDay);
}

export interface CreateBookingInput {
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  extraIds: string[];
  customer: { name: string; email: string; phone: string; licenseNumber: string; notes: string };
  /** The result from /src/api/payments.ts. */
  payment: PaymentResult;
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
 * Creates a booking. The price is worked out here from the vehicle's CURRENT rate
 * (never trusted from the browser), and stored on the booking so later rate
 * changes do not affect it.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  await simulateNetwork();

  const vehicles = readTable("vehicles");
  const bookings = readTable("bookings");
  const vehicle = vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) throw new ApiError("Vehicle not found", 404, "not_found");

  if (!isVehicleAvailable(vehicle, bookings, input)) {
    throw new ApiError("Vehicle is no longer available for these dates", 409, "vehicle_unavailable");
  }

  const extras = readTable("extras").filter((e) => input.extraIds.includes(e.id));
  const days = countRentalDays(input);
  const quote = buildQuote({ dailyRate: vehicle.pricePerDay, days, extras });

  // The customer paid (or agreed to pay) a specific amount. If the rate changed since, ask them to review again.
  if (input.payment.amount !== quote.total) {
    throw new ApiError("The price changed since payment", 409, "price_changed");
  }

  const now = new Date().toISOString();

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
    status: input.payment.status === "paid" ? "paid" : "pending",
    providerRef: input.payment.providerRef,
    createdAt: now,
  };

  const booking: Booking = {
    id: bookingId,
    reference: generateReference(new Set(bookings.map((b) => b.reference))),
    customerId: customer.id,
    vehicleId: vehicle.id,
    pickupLocationId: input.pickupLocationId,
    returnLocationId: input.returnLocationId,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    returnDate: input.returnDate,
    returnTime: input.returnTime,
    days: quote.days,
    dailyRate: quote.dailyRate,
    vehicleTotal: quote.vehicleTotal,
    extras: quote.extras,
    extrasTotal: quote.extrasTotal,
    total: quote.total,
    // Paid online = confirmed. Pay at pick-up waits for staff to confirm.
    status: input.payment.status === "paid" ? "confirmed" : "pending",
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

  return booking;
}

export interface BookingDetails {
  booking: Booking;
  vehicle: Vehicle;
  customer: Customer;
  payment: Payment | null;
  pickupLocation: Location | null;
  returnLocation: Location | null;
}

/**
 * Looks up a booking by its reference for the confirmation page.
 * A real API should also require proof of ownership (e.g. the email address or a token).
 */
export async function getBookingByReference(reference: string): Promise<BookingDetails | null> {
  await simulateNetwork();
  const booking = readTable("bookings").find((b) => b.reference.toLowerCase() === reference.toLowerCase());
  return booking ? toBookingDetails(booking) : null;
}

/** Joins a booking with its vehicle, customer, payment and locations. Shared with the admin screens. */
export function toBookingDetails(booking: Booking): BookingDetails | null {
  const vehicle = readTable("vehicles").find((v) => v.id === booking.vehicleId);
  const customer = readTable("customers").find((c) => c.id === booking.customerId);
  if (!vehicle || !customer) return null;

  const locations = readTable("locations");
  return {
    booking,
    vehicle,
    customer,
    payment: readTable("payments").find((p) => p.id === booking.paymentId) ?? null,
    pickupLocation: locations.find((l) => l.id === booking.pickupLocationId) ?? null,
    returnLocation: locations.find((l) => l.id === booking.returnLocationId) ?? null,
  };
}
