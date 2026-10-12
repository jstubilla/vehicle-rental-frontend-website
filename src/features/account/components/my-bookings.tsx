"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listOwnBookings, type BookingDetails } from "@/api/bookings";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { BOOKING_STATUS_BADGE } from "@/features/bookings/status-style";
import { CancelBooking } from "@/features/booking/components/cancel-booking";
import { canCustomerCancel, isPaymentOverdue, paymentDeadline } from "@/lib/booking-status";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { formatDateLong, formatDateTime } from "@/lib/dates";
import { ownBookingsKey, useAccount } from "../hooks/use-account";

const t = content.account.bookings;

/** What the customer should know about the booking right now, and the one thing to do next (if any). */
function describe({ booking, payment }: BookingDetails) {
  const deadline = paymentDeadline(booking);
  switch (booking.status) {
    case "pending":
      if (booking.documentsStatus === "rejected") {
        return { text: t.state.newPhotos, action: { href: `/book/documents/${booking.reference}`, label: t.sendNewPhotos } };
      }
      return { text: booking.documentsStatus === "pending" ? t.state.checking : t.state.pending, action: null };
    case "approved":
      return isPaymentOverdue(booking)
        ? { text: t.state.overdue, action: null }
        : {
            text: t.state.payBy(deadline ? formatDateTime(deadline) : ""),
            action: { href: `/book/pay/${booking.reference}`, label: t.payNow },
          };
    case "confirmed":
      return {
        text: payment?.downPayment
          ? t.state.balanceDue(formatCurrency(booking.total - payment.downPayment.amount))
          : t.state.paid,
        action: null,
      };
    case "cancelled":
      return { text: booking.cancellation ? t.state.cancelledByYou : t.state.cancelled, action: null };
    default:
      return { text: t.state[booking.status], action: null };
  }
}

function BookingRow({ details }: { details: BookingDetails }) {
  const { booking, vehicle } = details;
  const { text, action } = describe(details);

  return (
    <li>
      <Card
        as="article"
        aria-labelledby={`booking-${booking.id}`}
        className={cn("gap-3 p-4 md:p-5", action && "border-accent")}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 id={`booking-${booking.id}`} className="font-mono text-lg font-bold tracking-wider">
              {booking.reference}
            </h3>
            <p className="font-medium">{vehicle.name}</p>
            <p className="text-sm text-muted">
              {t.dates(formatDateLong(booking.pickupDate), formatDateLong(booking.returnDate))}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={BOOKING_STATUS_BADGE[booking.status]}>{content.enums.bookingStatus[booking.status]}</Badge>
            <p className="text-sm">
              <span className="text-muted">{t.total}: </span>
              <span className="font-medium">{formatCurrency(booking.total)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <p className={cn("text-sm", action ? "font-medium" : "text-muted")}>{text}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/book/confirmation/${booking.reference}`} aria-label={t.viewLabel(booking.reference)}>
                {t.view}
              </Link>
            </Button>
            {canCustomerCancel(booking) && <CancelBooking reference={booking.reference} size="sm" />}
            {action && (
              <Button asChild variant="accent" size="sm">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}

/** "My bookings": the signed-in customer's bookings, with the next step for each. */
export function MyBookings() {
  const { data: account, isSuccess: accountChecked } = useAccount();
  const bookings = useQuery({
    queryKey: [...ownBookingsKey, account?.id],
    queryFn: listOwnBookings,
    enabled: Boolean(account),
  });

  if (!accountChecked || (account && bookings.isPending)) {
    return (
      <div className="flex max-w-narrow flex-col gap-4" role="status" aria-label={content.ui.loading}>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (!account) {
    return (
      <EmptyState
        headingAs="h1"
        title={t.signedOutTitle}
        description={t.signedOutBody}
        action={
          <Button asChild variant="accent">
            <Link href="/login?next=/my-bookings">{t.login}</Link>
          </Button>
        }
      />
    );
  }

  if (bookings.isError) return <ErrorState headingAs="h1" onRetry={() => bookings.refetch()} />;

  const rows = bookings.data ?? [];
  // Bookings waiting on the customer come first, so the next step is never buried.
  const needsAction = rows.filter((details) => describe(details).action);
  const others = rows.filter((details) => !describe(details).action);

  return (
    <div className="flex max-w-narrow flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="text-lg text-muted">{t.description(account.email)}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyBody}
          action={
            <Button asChild variant="accent">
              <Link href="/book/dates">{t.book}</Link>
            </Button>
          }
        />
      ) : (
        <>
          {needsAction.length > 0 && (
            <section aria-labelledby="needs-action-heading" className="flex flex-col gap-3">
              <h2 id="needs-action-heading" className="text-lg">
                {t.needsAction}
              </h2>
              <ul className="flex flex-col gap-3">
                {needsAction.map((details) => (
                  <BookingRow key={details.booking.id} details={details} />
                ))}
              </ul>
            </section>
          )}
          {others.length > 0 && (
            <section aria-labelledby="all-bookings-heading" className="flex flex-col gap-3">
              <h2 id="all-bookings-heading" className={cn("text-lg", needsAction.length === 0 && "sr-only")}>
                {t.listLabel}
              </h2>
              <ul className="flex flex-col gap-3">
                {others.map((details) => (
                  <BookingRow key={details.booking.id} details={details} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="text-sm text-muted">{t.otherEmailNote}</p>
    </div>
  );
}
