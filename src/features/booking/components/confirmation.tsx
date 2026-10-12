"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { BookingDetails } from "@/api/bookings";
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { BOOKING_STATUS_BADGE } from "@/features/bookings/status-style";
import { canCustomerCancel, paymentDeadline } from "@/lib/booking-status";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useBookingDetails } from "../hooks/use-booking-details";
import { useBookingFlow } from "../hooks/use-booking-flow";
import { summaryFromBooking } from "../summary";
import { BookingSummary } from "./booking-summary";
import { CancelBooking } from "./cancel-booking";

const t = content.booking.confirmation;

/** Title, intro line, main action and next steps for each point in the booking's life. */
function describe({ booking, payment }: BookingDetails) {
  const deadline = paymentDeadline(booking);
  switch (booking.status) {
    case "pending":
      return booking.documentsStatus === "rejected"
        ? {
            title: t.titleRejected,
            subtitle: t.subtitleRejected,
            action: { href: `/book/documents/${booking.reference}`, label: t.sendNewPhotos },
            steps: t.nextSteps,
          }
        : { title: t.titlePending, subtitle: t.subtitlePending, action: null, steps: t.nextSteps };
    case "approved":
      return {
        title: t.titleApproved,
        subtitle: t.subtitleApproved(deadline ? formatDateTime(deadline) : ""),
        action: { href: `/book/pay/${booking.reference}`, label: t.payNow },
        steps: t.nextStepsConfirmed,
      };
    case "cancelled":
      return {
        title: t.titleCancelled,
        subtitle: booking.cancellation ? t.subtitleCancelledByYou : t.subtitleCancelled,
        action: null,
        steps: null,
      };
    default:
      return {
        title: t.titleConfirmed,
        subtitle: payment?.downPayment
          ? t.subtitleDownPayment(formatCurrency(booking.total - payment.downPayment.amount))
          : t.subtitleConfirmed,
        action: null,
        steps: t.nextStepsConfirmed,
      };
  }
}

/** Shown after the request is sent, and the place a customer comes back to for the booking's status. */
export function Confirmation({ reference }: { reference: string }) {
  const { reset } = useBookingFlow();
  const query = useBookingDetails(reference);

  // The request is sent, so the draft is no longer needed.
  useEffect(() => {
    reset();
  }, [reset]);

  if (query.isPending) {
    return (
      <div className="flex max-w-narrow flex-col gap-4" role="status" aria-label={content.booking.common.loading}>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  if (!query.data) {
    return (
      <EmptyState
        title={t.notFoundTitle}
        description={t.notFoundDescription}
        action={
          <Button asChild>
            <Link href="/">{t.toHome}</Link>
          </Button>
        }
      />
    );
  }

  const { booking } = query.data;
  const view = describe(query.data);

  return (
    <div className="flex max-w-narrow flex-col gap-8 transition-[opacity,transform] duration-(--duration-modal) ease-out-strong starting:translate-y-1.5 starting:opacity-0">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-display md:text-5xl">{view.title}</h1>
        <p className="text-lg text-muted">{view.subtitle}</p>
        {(view.action || canCustomerCancel(booking)) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {view.action && (
              <Button asChild size="lg" variant="accent">
                <Link href={view.action.href}>{view.action.label}</Link>
              </Button>
            )}
            {canCustomerCancel(booking) && <CancelBooking reference={booking.reference} size="md" />}
          </div>
        )}
      </div>

      {booking.documentsStatus === "rejected" && booking.status === "pending" && booking.rejectionReason && (
        <Alert variant="warning" title={content.booking.resubmit.reasonTitle}>
          {booking.rejectionReason}
        </Alert>
      )}

      {/* The reference is what people keep from this page, so it is the raised object on it. */}
      <Card variant="raised" className="gap-2 p-5 md:p-6">
        <p className="text-sm text-muted">{t.reference}</p>
        <p className="font-mono text-3xl font-bold tracking-wider md:text-4xl">{booking.reference}</p>
        <p className="text-sm text-muted">{t.referenceHint}</p>
        <p className="mt-2 border-t border-border pt-4">
          <span className="text-sm text-muted">{t.statusLabel}: </span>
          <Badge variant={BOOKING_STATUS_BADGE[booking.status]}>{content.enums.bookingStatus[booking.status]}</Badge>
        </p>
      </Card>

      <BookingSummary data={summaryFromBooking(query.data)} />

      {view.steps && (
        <section aria-labelledby="next-heading" className="flex flex-col gap-4">
          <h2 id="next-heading">{t.nextTitle}</h2>
          <ol className="ledger">
            {view.steps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-4 py-4">
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 font-heading text-2xl leading-none font-extrabold tracking-display text-foreground/20 tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg" variant="outline">
          <Link href="/">{t.toHome}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/vehicles">{t.browse}</Link>
        </Button>
      </div>
    </div>
  );
}
