import type { BookingDetails } from "@/api/bookings";
import { paymentDeadline } from "@/lib/booking-status";
import type { EmailBooking } from "./templates";

export * from "./templates";
export type { RenderedEmail } from "./layout";

/** Turns a saved booking into what the email templates need. */
export function toEmailBooking({ booking, vehicle, customer, payment }: BookingDetails): EmailBooking {
  return {
    reference: booking.reference,
    customerName: customer.name,
    vehicleName: vehicle.name,
    pickup: { location: booking.pickupLocation, date: booking.pickupDate, time: booking.pickupTime },
    returnTrip: { location: booking.returnLocation, date: booking.returnDate, time: booking.returnTime },
    total: booking.total,
    downPayment: payment?.downPayment?.amount ?? null,
    paymentDeadline: paymentDeadline(booking),
    rejectionReason: booking.rejectionReason ?? null,
  };
}
