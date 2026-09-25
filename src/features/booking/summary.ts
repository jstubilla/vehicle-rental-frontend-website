import type { BookingDetails } from "@/api/bookings";
import { content } from "@/content";
import type { Quote } from "@/lib/pricing";
import type { Vehicle } from "@/types";
import type { FlowState } from "./flow-store";

interface TripPoint {
  location: string;
  date: string;
  time: string;
}

/** Everything the summary card shows, in one plain shape. */
export interface SummaryData {
  vehicle: { name: string; meta: string } | null;
  pickup: TripPoint | null;
  returnTrip: TripPoint | null;
  days: number | null;
  dailyRate: number | null;
  vehicleTotal: number | null;
  total: number | null;
  driver: { name: string; email: string; phone: string } | null;
  payment: string | null;
}

const vehicleMeta = (vehicle: Vehicle) =>
  vehicle.seats !== undefined
    ? `${vehicle.examples} · ${content.vehicleCard.seats(vehicle.seats)}`
    : vehicle.examples;

/** Summary of a booking that is still being filled in. */
export function summaryFromFlow({
  state,
  vehicle,
  quote,
}: {
  state: FlowState;
  vehicle: Vehicle | null;
  quote: Quote | null;
}): SummaryData {
  const rental = state.rental;
  return {
    vehicle: vehicle ? { name: vehicle.name, meta: vehicleMeta(vehicle) } : null,
    pickup: rental ? { location: rental.pickupLocation, date: rental.pickupDate, time: rental.pickupTime } : null,
    returnTrip: rental
      ? { location: rental.returnLocation, date: rental.returnDate, time: rental.returnTime }
      : null,
    days: quote?.days ?? null,
    dailyRate: quote?.dailyRate ?? null,
    vehicleTotal: quote?.vehicleTotal ?? null,
    total: quote?.total ?? null,
    driver: state.customer,
    payment: null,
  };
}

/** Summary of a saved booking. It shows the prices the booking was made at. */
export function summaryFromBooking({ booking, vehicle, customer, payment }: BookingDetails): SummaryData {
  return {
    vehicle: { name: vehicle.name, meta: vehicleMeta(vehicle) },
    pickup: { location: booking.pickupLocation, date: booking.pickupDate, time: booking.pickupTime },
    returnTrip: { location: booking.returnLocation, date: booking.returnDate, time: booking.returnTime },
    days: booking.days,
    dailyRate: booking.dailyRate,
    vehicleTotal: booking.vehicleTotal,
    total: booking.total,
    driver: { name: customer.name, email: customer.email, phone: customer.phone },
    payment: payment ? content.enums.paymentMethod[payment.method] : null,
  };
}
