"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import { content } from "@/content";
import { BookingSummary } from "@/features/booking/components/booking-summary";
import { summaryFromBooking } from "@/features/booking/summary";
import { BOOKING_TRANSITIONS } from "@/lib/booking-status";
import type { BookingStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useBookingMutations } from "../hooks/use-booking-mutations";
import { useBooking } from "../hooks/use-bookings";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";

const t = content.admin.bookings.detail;

export function BookingDetail({ id }: { id: string }) {
  const query = useBooking(id);
  const { changeStatus, markPaid } = useBookingMutations();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (query.isError) return <ErrorState headingAs="h1" onRetry={() => query.refetch()} />;
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!query.data) {
    return (
      <EmptyState
        headingAs="h1"
        title={content.admin.common.notFoundTitle}
        description={content.admin.common.notFoundDescription}
        action={
          <Button asChild>
            <Link href="/admin/bookings">{t.back}</Link>
          </Button>
        }
      />
    );
  }

  const details = query.data;
  const { booking, customer, payment } = details;
  const nextStatuses = BOOKING_TRANSITIONS[booking.status];

  function move(status: BookingStatus) {
    if (status === "cancelled") setConfirmingCancel(true);
    else changeStatus.mutate({ id: booking.id, status });
  }

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="link" className="self-start">
        <Link href="/admin/bookings">← {t.back}</Link>
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="font-mono">{booking.reference}</h1>
        <p className="flex flex-wrap items-center gap-2 text-muted">
          <BookingStatusBadge status={booking.status} />
          {t.booked} {formatDateTime(booking.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <BookingSummary data={summaryFromBooking(details)} />
          <p className="text-sm text-muted">{t.priceNote}</p>

          <Card as="section" aria-labelledby="notes-heading">
            <CardHeader>
              <CardTitle as="h2" id="notes-heading" className="text-xl">
                {t.notes}
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap">{booking.notes || t.noNotes}</CardContent>
          </Card>
        </div>

        <aside aria-label={t.nextStep} className="flex min-w-0 flex-col gap-6 lg:col-span-1">
          <Card as="section" aria-labelledby="status-heading">
            <CardHeader>
              <CardTitle as="h2" id="status-heading" className="text-xl">
                {t.status}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p>
                <BookingStatusBadge status={booking.status} />
              </p>
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-muted">{t.finalStatus}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={status === "cancelled" ? "outline" : "primary"}
                      loading={changeStatus.isPending && changeStatus.variables?.status === status}
                      disabled={changeStatus.isPending}
                      onClick={() => move(status)}
                    >
                      {t.actions[status]}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {payment && (
            <Card as="section" aria-labelledby="payment-heading">
              <CardHeader>
                <CardTitle as="h2" id="payment-heading" className="text-xl">
                  {t.payment}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <dl className="flex flex-col gap-2">
                  <div>
                    <dt className="text-sm text-muted">{t.method}</dt>
                    <dd className="font-medium">{content.enums.paymentMethod[payment.method]}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">{t.amount}</dt>
                    <dd className="font-medium">{formatCurrency(payment.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">{t.status}</dt>
                    <dd>
                      <PaymentStatusBadge status={payment.status} />
                    </dd>
                  </div>
                  {payment.providerRef && (
                    <div className="min-w-0">
                      <dt className="text-sm text-muted">{t.providerRef}</dt>
                      <dd className="font-mono text-sm wrap-anywhere">{payment.providerRef}</dd>
                    </div>
                  )}
                </dl>
                {payment.status === "pending" && booking.status !== "cancelled" && (
                  <Button variant="outline" loading={markPaid.isPending} onClick={() => markPaid.mutate(booking.id)}>
                    {t.markPaid}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card as="section" aria-labelledby="customer-heading">
            <CardHeader>
              <CardTitle as="h2" id="customer-heading" className="text-xl">
                {t.customer}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="font-medium">{customer.name}</p>
              <Button asChild variant="link" size="sm" className="self-start">
                <Link href={`/admin/customers/${customer.id}`}>{t.viewCustomer}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmModal
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t.cancelTitle}
        description={t.cancelDescription}
        confirmLabel={t.cancelConfirm}
        cancelLabel={t.keep}
        loading={changeStatus.isPending}
        onConfirm={() =>
          changeStatus.mutate({ id: booking.id, status: "cancelled" }, { onSettled: () => setConfirmingCancel(false) })
        }
      />
    </div>
  );
}
