import { content } from "@/content";
import { PAYMENT_DEADLINE_HOURS } from "@/lib/booking-status";
import { formatPhp } from "@/lib/currency";
import { formatDateLong, formatDateTime, formatTime12h } from "@/lib/dates";
import { DOWN_PAYMENT_RATE } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { renderEmail, type RenderedEmail, type SummaryRow } from "./layout";

/**
 * The emails the booking flow sends. Each takes plain booking details and returns the subject,
 * HTML and plain text, ready for any email service. The places that send them are marked
 * "EMAIL TRIGGER GOES HERE" in /src/api/bookings.ts and /src/api/booking-admin.ts.
 * Preview them all at Admin > Emails.
 */

const t = content.emails;

/** What the templates need to know about a booking. */
export interface EmailBooking {
  reference: string;
  customerName: string;
  vehicleName: string;
  pickup: { location: string; date: string; time: string };
  returnTrip: { location: string; date: string; time: string };
  total: number;
  /** "Pay at pick-up" only, once paid. */
  downPayment?: number | null;
  /** ISO time the booking must be paid by (approved bookings). */
  paymentDeadline?: string | null;
  /** Why staff rejected the documents. */
  rejectionReason?: string | null;
}

const money = (amount: number) => formatPhp(amount, { exact: true });
const when = (trip: EmailBooking["pickup"]) => `${formatDateLong(trip.date)}, ${formatTime12h(trip.time)}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * Links in the emails. A real backend should add a signed, expiring token to the pay and
 * new-photos links, so the customer does not have to type their email to open them.
 */
export const emailLinks = {
  booking: (reference: string) => `${SITE_URL}/book/confirmation/${reference}`,
  pay: (reference: string) => `${SITE_URL}/book/pay/${reference}`,
  newPhotos: (reference: string) => `${SITE_URL}/book/documents/${reference}`,
  admin: (bookingId: string) => `${SITE_URL}/admin/bookings/${bookingId}`,
};

function summary(booking: EmailBooking, { paid = false }: { paid?: boolean } = {}): SummaryRow[] {
  const rows: SummaryRow[] = [
    { label: t.summary.reference, value: booking.reference },
    { label: t.summary.vehicle, value: booking.vehicleName },
    { label: t.summary.pickup, value: when(booking.pickup), detail: booking.pickup.location },
    { label: t.summary.return, value: when(booking.returnTrip), detail: booking.returnTrip.location },
  ];
  if (paid && booking.downPayment) {
    rows.push(
      { label: t.summary.downPayment, value: money(booking.downPayment) },
      { label: t.summary.balance, value: money(booking.total - booking.downPayment) },
    );
  }
  rows.push({ label: t.summary.total, value: money(booking.total), emphasis: true });
  return rows;
}

const deadlineText = (booking: EmailBooking) => (booking.paymentDeadline ? formatDateTime(booking.paymentDeadline) : "");

/** To the customer, right after they send a booking request. */
export function requestReceivedEmail(booking: EmailBooking): RenderedEmail {
  const e = t.requestReceived;
  return renderEmail({
    subject: e.subject(booking.reference),
    preheader: e.preheader,
    heading: e.heading,
    greeting: t.greeting(firstName(booking.customerName)),
    intro: [e.intro],
    summary: summary(booking),
    outro: [e.next(PAYMENT_DEADLINE_HOURS)],
    button: { label: e.button, url: emailLinks.booking(booking.reference) },
  });
}

/** To your team, when documents are waiting to be checked (a new request, or new photos). */
export function staffNewRequestEmail(
  booking: EmailBooking,
  { bookingId, resent = false }: { bookingId: string; resent?: boolean },
): RenderedEmail {
  const e = t.staffNewRequest;
  return renderEmail({
    subject: resent ? e.subjectResent(booking.reference) : e.subject(booking.reference),
    preheader: e.preheader,
    heading: resent ? e.headingResent : e.heading,
    intro: [resent ? e.introResent(booking.customerName) : e.intro(booking.customerName)],
    summary: summary(booking),
    button: { label: e.button, url: emailLinks.admin(bookingId) },
  });
}

/** To the customer, when staff approve the documents: the link to pay. */
export function documentsApprovedEmail(booking: EmailBooking): RenderedEmail {
  const e = t.documentsApproved;
  const deadline = deadlineText(booking);
  return renderEmail({
    subject: e.subject(booking.reference),
    preheader: e.preheader(deadline),
    heading: e.heading,
    greeting: t.greeting(firstName(booking.customerName)),
    intro: [e.intro(deadline)],
    summary: summary(booking),
    outro: [e.options(DOWN_PAYMENT_RATE * 100)],
    button: { label: e.button, url: emailLinks.pay(booking.reference) },
    footnote: e.deadlineNote,
  });
}

/** To the customer, when staff reject the documents: the reason, and the link to send new photos. */
export function documentsRejectedEmail(booking: EmailBooking): RenderedEmail {
  const e = t.documentsRejected;
  return renderEmail({
    subject: e.subject(booking.reference),
    preheader: e.preheader,
    heading: e.heading,
    greeting: t.greeting(firstName(booking.customerName)),
    intro: [e.intro],
    notice: booking.rejectionReason ? { title: e.reasonTitle, body: booking.rejectionReason } : undefined,
    button: { label: e.button, url: emailLinks.newPhotos(booking.reference) },
    footnote: e.tip,
  });
}

/** To the customer, once they have paid (in full, or the down payment). */
export function bookingConfirmedEmail(booking: EmailBooking): RenderedEmail {
  const e = t.bookingConfirmed;
  return renderEmail({
    subject: e.subject(booking.reference),
    preheader: e.preheader,
    heading: e.heading,
    greeting: t.greeting(firstName(booking.customerName)),
    intro: [booking.downPayment ? e.introDownPayment(money(booking.total - booking.downPayment)) : e.intro],
    summary: summary(booking, { paid: true }),
    outro: [e.bring],
    button: { label: e.button, url: emailLinks.booking(booking.reference) },
  });
}

/** To the customer, a few hours before the payment deadline if the booking is still unpaid. */
export function paymentReminderEmail(booking: EmailBooking): RenderedEmail {
  const e = t.paymentReminder;
  const deadline = deadlineText(booking);
  return renderEmail({
    subject: e.subject(booking.reference),
    preheader: e.preheader(deadline),
    heading: e.heading,
    greeting: t.greeting(firstName(booking.customerName)),
    intro: [e.intro(deadline)],
    summary: summary(booking),
    button: { label: e.button, url: emailLinks.pay(booking.reference) },
    footnote: t.documentsApproved.deadlineNote,
  });
}
