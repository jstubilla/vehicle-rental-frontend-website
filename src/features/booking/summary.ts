import type { BookingDetails } from "@/api/bookings";
import { content } from "@/content";
import type { Quote } from "@/lib/pricing";
import type { Location, Vehicle } from "@/types";
import type { FlowState } from "./flow-store";
import { locationName } from "./hooks/use-locations";

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
  extras: { name: string; total: number }[];
  total: number | null;
  driver: { name: string; email: string; phone: string } | null;
  payment: string | null;
}

const vehicleMeta = (vehicle: Vehicle) =>
  `${content.enums.vehicleCategory[vehicle.category]} · ${content.enums.transmission[vehicle.transmission]} · ${content.vehicleCard.seats(vehicle.seats)}`;

/** Summary of a booking that is still being filled in. */
export function summaryFromFlow({
  state,
  vehicle,
  quote,
  locations,
}: {
  state: FlowState;
  vehicle: Vehicle | null;
  quote: Quote | null;
  locations: Location[];
}): SummaryData {
  const rental = state.rental;
  return {
    vehicle: vehicle ? { name: vehicle.name, meta: vehicleMeta(vehicle) } : null,
    pickup: rental
      ? { location: locationName(locations, rental.pickupLocation), date: rental.pickupDate, time: rental.pickupTime }
      : null,
    returnTrip: rental
      ? { location: locationName(locations, rental.returnLocation), date: rental.returnDate, time: rental.returnTime }
      : null,
    days: quote?.days ?? null,
    dailyRate: quote?.dailyRate ?? null,
    vehicleTotal: quote?.vehicleTotal ?? null,
    extras: quote?.extras.map((line) => ({ name: line.name, total: line.total })) ?? [],
    total: quote?.total ?? null,
    driver: state.customer,
    payment: state.payment ? content.enums.paymentMethod[state.payment.method] : null,
  };
}

/** Summary of a saved booking. It shows the prices the booking was made at. */
export function summaryFromBooking({ booking, vehicle, customer, payment, pickupLocation, returnLocation }: BookingDetails): SummaryData {
  return {
    vehicle: { name: vehicle.name, meta: vehicleMeta(vehicle) },
    pickup: { location: pickupLocation?.name ?? "", date: booking.pickupDate, time: booking.pickupTime },
    returnTrip: { location: returnLocation?.name ?? "", date: booking.returnDate, time: booking.returnTime },
    days: booking.days,
    dailyRate: booking.dailyRate,
    vehicleTotal: booking.vehicleTotal,
    extras: booking.extras.map((line) => ({ name: line.name, total: line.total })),
    total: booking.total,
    driver: { name: customer.name, email: customer.email, phone: customer.phone },
    payment: payment ? content.enums.paymentMethod[payment.method] : null,
  };
}
