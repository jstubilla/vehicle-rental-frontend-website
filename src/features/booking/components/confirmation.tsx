"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { useBookingDetails } from "../hooks/use-booking-details";
import { useBookingFlow } from "../hooks/use-booking-flow";
import { summaryFromBooking } from "../summary";
import { BookingSummary } from "./booking-summary";

const t = content.booking.confirmation;

export function Confirmation({ reference }: { reference: string }) {
  const { reset } = useBookingFlow();
  const query = useBookingDetails(reference);

  // The booking is made, so the draft is no longer needed.
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
  const confirmed = booking.status !== "pending";

  return (
    <div className="flex max-w-narrow flex-col gap-8 transition-[opacity,transform] duration-(--duration-modal) ease-out-strong starting:translate-y-1.5 starting:opacity-0">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-extrabold tracking-display md:text-5xl">
          {confirmed ? t.titleConfirmed : t.titlePending}
        </h1>
        <p className="text-lg text-muted">{confirmed ? t.subtitleConfirmed : t.subtitlePending}</p>
      </div>

      {/* The reference is what people keep from this page, so it is the raised object on it. */}
      <Card variant="raised" className="gap-2 p-5 md:p-6">
        <p className="text-sm text-muted">{t.reference}</p>
        <p className="font-mono text-3xl font-bold tracking-wider md:text-4xl">{booking.reference}</p>
        <p className="text-sm text-muted">{t.referenceHint}</p>
        <p className="mt-2 border-t border-border pt-4">
          <span className="text-sm text-muted">{t.statusLabel}: </span>
          <Badge variant={confirmed ? "success" : "warning"}>{content.enums.bookingStatus[booking.status]}</Badge>
        </p>
      </Card>

      <BookingSummary data={summaryFromBooking(query.data)} />

      <section aria-labelledby="next-heading" className="flex flex-col gap-4">
        <h2 id="next-heading">{t.nextTitle}</h2>
        <ol className="ledger">
          {t.nextSteps.map((step, index) => (
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
