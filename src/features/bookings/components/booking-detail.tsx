"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChevronLeftIcon,
  ConfirmModal,
  EmptyState,
  ErrorState,
  FormField,
  Modal,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { content } from "@/content";
import { BookingSummary } from "@/features/booking/components/booking-summary";
import { DocumentGallery } from "@/features/booking/components/document-gallery";
import { summaryFromBooking } from "@/features/booking/summary";
import { BOOKING_TRANSITIONS, isPaymentOverdue, paymentDeadline } from "@/lib/booking-status";
import type { BookingStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useBookingMutations } from "../hooks/use-booking-mutations";
import { useBooking } from "../hooks/use-bookings";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";

const t = content.admin.bookings.detail;

const DOCUMENT_BADGE = { pending: "warning", verified: "success", rejected: "danger" } as const;

export function BookingDetail({ id }: { id: string }) {
  const query = useBooking(id);
  const { changeStatus, markPaid, reviewDocuments } = useBookingMutations();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);

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
  const documentsStatus = booking.documentsStatus ?? "pending";
  // A booking with documents is confirmed only when the customer pays, never with the status buttons.
  const nextStatuses = BOOKING_TRANSITIONS[booking.status].filter(
    (status) => !(booking.documents && status === "confirmed"),
  );
  const deadline = paymentDeadline(booking);
  const canReview = booking.status === "pending" && documentsStatus === "pending";

  function reject() {
    if (!reason.trim()) {
      setShowReasonError(true);
      return;
    }
    reviewDocuments.mutate(
      { id: booking.id, decision: "rejected", reason },
      {
        onSuccess: () => {
          setRejecting(false);
          setReason("");
        },
      },
    );
  }

  function move(status: BookingStatus) {
    if (status === "cancelled") setConfirmingCancel(true);
    else changeStatus.mutate({ id: booking.id, status });
  }

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="link" className="self-start">
        <Link href="/admin/bookings" className="inline-flex items-center gap-1">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          {t.back}
        </Link>
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
          {booking.documents && (
            <Card as="section" aria-labelledby="documents-heading">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle as="h2" id="documents-heading" className="text-xl">
                    {t.documents.title}
                  </CardTitle>
                  <Badge variant={DOCUMENT_BADGE[documentsStatus]}>{t.documents.status[documentsStatus]}</Badge>
                </div>
                {documentsStatus !== "verified" && <p className="text-sm text-muted">{t.documents.description}</p>}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <DocumentGallery documents={booking.documents} />
                {documentsStatus === "rejected" && (
                  <div className="flex flex-col gap-1 rounded-md bg-surface-muted p-4 text-sm">
                    <p className="font-medium">{t.documents.rejectedReason}</p>
                    <p className="whitespace-pre-wrap">{booking.rejectionReason}</p>
                    <p className="text-muted">{t.documents.waitingForPhotos}</p>
                  </div>
                )}
                {canReview && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      loading={reviewDocuments.isPending && reviewDocuments.variables?.decision === "verified"}
                      disabled={reviewDocuments.isPending}
                      onClick={() => reviewDocuments.mutate({ id: booking.id, decision: "verified" })}
                    >
                      {t.documents.approve}
                    </Button>
                    <Button variant="outline" disabled={reviewDocuments.isPending} onClick={() => setRejecting(true)}>
                      {t.documents.reject}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
              {booking.documents && booking.status === "pending" && (
                <p className="text-sm text-muted">{t.documents.checkFirst}</p>
              )}
              {booking.status === "approved" && (
                <div className="flex flex-col gap-2 text-sm">
                  <p className="text-muted">{t.documents.awaitingPayment}</p>
                  {deadline && <p className="font-medium">{t.documents.payBy(formatDateTime(deadline))}</p>}
                  {isPaymentOverdue(booking) && (
                    <p className="font-medium text-danger">{t.documents.overdue}</p>
                  )}
                  <p className="min-w-0">
                    <span className="block text-muted">{t.documents.payLink}</span>
                    <Link href={`/book/pay/${booking.reference}`} className="font-mono wrap-anywhere text-link underline underline-offset-4">
                      /book/pay/{booking.reference}
                    </Link>
                  </p>
                </div>
              )}
              {booking.cancellation && (
                <div className="flex flex-col gap-1 rounded-md bg-surface-muted p-3 text-sm">
                  <p className="font-medium">{t.cancelledByCustomer}</p>
                  <p className="text-muted">{formatDateTime(booking.cancellation.at)}</p>
                  <p>
                    <span className="text-muted">{t.cancellationReason}: </span>
                    <span className="whitespace-pre-wrap">{booking.cancellation.reason}</span>
                  </p>
                </div>
              )}
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
                  {payment.downPayment && (
                    <>
                      <div>
                        <dt className="text-sm text-muted">
                          {t.downPayment(content.enums.paymentMethod[payment.downPayment.method])}
                        </dt>
                        <dd className="font-medium">{formatCurrency(payment.downPayment.amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted">{t.balance}</dt>
                        <dd className="font-medium">{formatCurrency(payment.amount - payment.downPayment.amount)}</dd>
                      </div>
                    </>
                  )}
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

      <Modal
        open={rejecting}
        onOpenChange={(open) => {
          setRejecting(open);
          setShowReasonError(false);
        }}
        title={t.documents.rejectTitle}
        description={t.documents.rejectDescription}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              {t.documents.keep}
            </Button>
            <Button variant="danger" loading={reviewDocuments.isPending} onClick={reject}>
              {t.documents.rejectConfirm}
            </Button>
          </>
        }
      >
        <FormField
          label={t.documents.reasonLabel}
          required
          hint={t.documents.reasonHint}
          error={showReasonError && !reason.trim() ? t.documents.reasonRequired : undefined}
        >
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </Modal>

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
