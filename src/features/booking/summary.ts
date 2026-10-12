import type { BookingDetails } from "@/api/bookings";
import { content } from "@/content";
import { splitDownPayment, type Quote } from "@/lib/pricing";
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
  /** "Vehicle only" or "With a driver", once a vehicle is chosen. */
  option: string | null;
  dailyRate: number | null;
  vehicleTotal: number | null;
  /** The driver line, for "With a driver" only. */
  driverRate: number | null;
  driverTotal: number | null;
  total: number | null;
  /**
   * "Pay at pick-up": the down payment and the balance left for pick-up. `paidWith` is set once
   * the down payment has been paid (on a saved booking).
   */
  downPayment: { amount: number; balance: number; paidWith: string | null } | null;
  /** The person who booked (their contact details), not the hired driver. */
  renter: { name: string; email: string; phone: string } | null;
  payment: string | null;
}

const optionLabel = (withDriver: boolean) =>
  withDriver ? content.booking.driverOption.withDriver : content.booking.driverOption.vehicleOnly;

const vehicleMeta = (vehicle: Vehicle) =>
  vehicle.seats !== undefined
    ? `${vehicle.examples} · ${content.vehicleCard.seats(vehicle.seats)}`
    : vehicle.examples;

/** Summary of a booking that is still being filled in. */
export function summaryFromFlow({
  state,
  vehicle,
  quote,
  payAtPickup = false,
}: {
  state: FlowState;
  vehicle: Vehicle | null;
  quote: Quote | null;
  /** True on the payment step while "Pay at pick-up" is chosen. */
  payAtPickup?: boolean;
}): SummaryData {
  const rental = state.rental;
  const split = quote && payAtPickup ? splitDownPayment(quote.total) : null;
  return {
    vehicle: vehicle ? { name: vehicle.name, meta: vehicleMeta(vehicle) } : null,
    pickup: rental ? { location: rental.pickupLocation, date: rental.pickupDate, time: rental.pickupTime } : null,
    returnTrip: rental
      ? { location: rental.returnLocation, date: rental.returnDate, time: rental.returnTime }
      : null,
    days: quote?.days ?? null,
    option: quote ? optionLabel(quote.withDriver) : null,
    dailyRate: quote?.dailyRate ?? null,
    vehicleTotal: quote?.vehicleTotal ?? null,
    driverRate: quote?.withDriver ? quote.driverRate : null,
    driverTotal: quote?.withDriver ? quote.driverTotal : null,
    total: quote?.total ?? null,
    downPayment: split ? { amount: split.downPayment, balance: split.balance, paidWith: null } : null,
    renter: state.customer,
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
    option: optionLabel(booking.withDriver),
    dailyRate: booking.dailyRate,
    vehicleTotal: booking.vehicleTotal,
    driverRate: booking.withDriver ? booking.driverRate : null,
    driverTotal: booking.withDriver ? booking.driverTotal : null,
    total: booking.total,
    downPayment: payment?.downPayment
      ? {
          amount: payment.downPayment.amount,
          balance: booking.total - payment.downPayment.amount,
          paidWith: content.enums.paymentMethod[payment.downPayment.method],
        }
      : null,
    renter: { name: customer.name, email: customer.email, phone: customer.phone },
    payment: payment ? content.enums.paymentMethod[payment.method] : null,
  };
}
