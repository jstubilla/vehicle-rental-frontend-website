import type { BookingStatus, PaymentMethod } from "@/lib/constants";
import { countRentalDays } from "@/lib/rental";
import { buildQuote } from "@/lib/pricing";
import type { Booking, Payment } from "@/types";
import { dayOffset, timestampAt } from "./helpers";
import { seedVehicles } from "./vehicles";

interface Row {
  customer: number; // index into seedCustomers
  vehicleId: string;
  start: number; // days from today
  nights: number;
  status: BookingStatus;
  method: PaymentMethod;
  /** Wherever the visitor typed or pasted, e.g. an address or a Google Maps link. */
  pickupLocation: string;
  returnLocation?: string;
  pickupTime?: string;
  returnTime?: string;
  /** Older bookings were made at a lower rate than today's, to show that rates are kept per booking. */
  rateDiscount?: number;
}

const rows: Row[] = [
  { customer: 0, vehicleId: "veh-03", start: -45, nights: 3, status: "completed", method: "card", pickupLocation: "NAIA Terminal 3, Pasay", rateDiscount: 200 },
  { customer: 1, vehicleId: "veh-02", start: -38, nights: 5, status: "completed", method: "gcash", pickupLocation: "Makati CBD", rateDiscount: 200 },
  { customer: 2, vehicleId: "veh-01", start: -30, nights: 4, status: "completed", method: "maya", pickupLocation: "BGC, Taguig", rateDiscount: 300 },
  { customer: 3, vehicleId: "veh-04", start: -22, nights: 2, status: "completed", method: "pay_at_pickup", pickupLocation: "NAIA Terminal 3, Pasay", rateDiscount: 100 },
  { customer: 4, vehicleId: "veh-03", start: -12, nights: 3, status: "cancelled", method: "card", pickupLocation: "Makati CBD" },
  { customer: 5, vehicleId: "veh-01", start: -9, nights: 3, status: "cancelled", method: "gcash", pickupLocation: "BGC, Taguig" },
  { customer: 6, vehicleId: "veh-03", start: -2, nights: 4, status: "active", method: "card", pickupLocation: "NAIA Terminal 3, Pasay", returnLocation: "Makati CBD" },
  { customer: 7, vehicleId: "veh-06", start: -1, nights: 3, status: "active", method: "maya", pickupLocation: "Clark International Airport, Pampanga" },
  { customer: 8, vehicleId: "veh-05", start: 0, nights: 5, status: "active", method: "card", pickupLocation: "Makati CBD", pickupTime: "09:00" },
  { customer: 9, vehicleId: "veh-01", start: 2, nights: 3, status: "confirmed", method: "gcash", pickupLocation: "Mactan-Cebu Airport" },
  { customer: 1, vehicleId: "veh-01", start: 4, nights: 4, status: "confirmed", method: "card", pickupLocation: "BGC, Taguig" },
  { customer: 11, vehicleId: "veh-01", start: 6, nights: 2, status: "confirmed", method: "maya", pickupLocation: "Makati CBD" },
  { customer: 0, vehicleId: "veh-03", start: 9, nights: 5, status: "confirmed", method: "gcash", pickupLocation: "NAIA Terminal 3, Pasay" },
  { customer: 13, vehicleId: "veh-05", start: 12, nights: 3, status: "confirmed", method: "card", pickupLocation: "Clark International Airport, Pampanga", pickupTime: "08:00", returnTime: "18:00" },
  { customer: 14, vehicleId: "veh-03", start: 3, nights: 2, status: "pending", method: "pay_at_pickup", pickupLocation: "BGC, Taguig" },
];

function reference(n: number): string {
  return `RC-${(n * 7919 + 100003).toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}

const built = rows.map((row, index) => {
  const n = index + 1;
  const vehicle = seedVehicles.find((v) => v.id === row.vehicleId)!;
  const pickupDate = dayOffset(row.start);
  const returnDate = dayOffset(row.start + row.nights);
  const pickupTime = row.pickupTime ?? "10:00";
  const returnTime = row.returnTime ?? "10:00";
  const days = countRentalDays({ pickupDate, pickupTime, returnDate, returnTime });
  const returnLocation = row.returnLocation ?? row.pickupLocation;
  const quote = buildQuote({ dailyRate: vehicle.pricePerDay - (row.rateDiscount ?? 0), days });
  const createdAt = timestampAt(row.start - 3 - (n % 4));
  const bookingId = `bkg-${String(n).padStart(2, "0")}`;
  const paymentId = `pay-${String(n).padStart(2, "0")}`;

  const paid = row.method !== "pay_at_pickup" || row.status === "completed";
  const booking: Booking = {
    id: bookingId,
    reference: reference(n),
    customerId: `cus-${String(row.customer + 1).padStart(2, "0")}`,
    vehicleId: row.vehicleId,
    pickupLocation: row.pickupLocation,
    returnLocation,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    days: quote.days,
    dailyRate: quote.dailyRate,
    vehicleTotal: quote.vehicleTotal,
    total: quote.total,
    status: row.status,
    paymentId,
    notes: "",
    createdAt,
    updatedAt: createdAt,
  };
  const payment: Payment = {
    id: paymentId,
    bookingId,
    method: row.method,
    amount: quote.total,
    status: paid ? "paid" : "pending",
    providerRef: row.method === "pay_at_pickup" ? null : `MOCK-${reference(n).slice(3)}`,
    createdAt,
  };
  return { booking, payment };
});

export const seedBookings: Booking[] = built.map((b) => b.booking);
export const seedPayments: Payment[] = built.map((b) => b.payment);
