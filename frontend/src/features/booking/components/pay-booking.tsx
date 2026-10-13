"use client";

import Link from "next/link";
import { type BookingDetails } from "@/api/bookings";
import { Alert, Button } from "@/components/ui";
import { content } from "@/content";
import { isPaymentOverdue, paymentDeadline } from "@/lib/booking-status";
import { formatDateTime } from "@/lib/dates";
import { usePayBooking } from "../hooks/use-pay-booking";
import { confirmationPath } from "../steps";
import { summaryFromBooking } from "../summary";
import { BookingAccess } from "./booking-access";
import { BookingSummary } from "./booking-summary";
import { PaymentForm } from "./payment-form";
import { StepHeading } from "./step-parts";

const t = content.booking.pay;

/** The page behind the "Pay now" link we email once staff approve the customer's documents. */
export function PayBooking({ reference }: { reference: string }) {
  return (
    <BookingAccess reference={reference} title={t.title} description={t.accessDescription(reference.toUpperCase())}>
      {({ details, email }) => <PayOrExplain details={details} email={email} />}
    </BookingAccess>
  );
}

function PayOrExplain({ details, email }: { details: BookingDetails; email: string }) {
  const { booking } = details;

  if (booking.status === "approved" && !isPaymentOverdue(booking)) {
    return <PayNow details={details} email={email} />;
  }

  const notice =
    booking.status === "pending"
      ? { title: t.pendingTitle, body: t.pendingBody }
      : booking.status === "approved"
        ? { title: t.overdueTitle, body: t.overdueBody }
        : booking.status === "cancelled"
          ? { title: t.cancelledTitle, body: "" }
          : { title: t.paidTitle, body: "" };

  return (
    <div className="flex max-w-narrow flex-col gap-6">
      <StepHeading title={notice.title} description={notice.body || undefined} />
      <div>
        <Button asChild variant="outline">
          <Link href={confirmationPath(booking.reference)}>{t.viewBooking}</Link>
        </Button>
      </div>
    </div>
  );
}

function PayNow({ details, email }: { details: BookingDetails; email: string }) {
  const { booking } = details;
  const payment = usePayBooking(booking.reference, email);
  const deadline = paymentDeadline(booking);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <StepHeading title={content.booking.payment.title} description={content.booking.payment.description} />
        {deadline && (
          <Alert variant="warning" title={content.booking.payment.deadlineTitle(formatDateTime(deadline))}>
            {content.booking.payment.deadlineBody}
          </Alert>
        )}
        <PaymentForm total={booking.total} payment={payment} />
      </div>

      <aside className="order-first min-w-0 lg:order-none lg:col-span-1">
        <BookingSummary
          data={summaryFromBooking(details, { payAtPickup: payment.method === "pay_at_pickup" })}
          collapsible
          className="lg:sticky lg:top-24"
        />
      </aside>
    </div>
  );
}
