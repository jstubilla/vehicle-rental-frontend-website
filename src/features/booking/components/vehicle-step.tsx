"use client";

import Link from "next/link";
import { Alert, Button, ErrorState, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { useVehicleList } from "@/features/vehicles/hooks/use-vehicles";
import { useBookingFlow } from "../hooks/use-booking-flow";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useStepGuard } from "../hooks/use-step-guard";
import { nextStepPath, previousStepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";
import { VehicleOption } from "./vehicle-option";

const t = content.booking.vehicle;

/** Booking is open: every vehicle is offered for any dates, except one under maintenance. */
export function VehicleStep() {
  const { ready, state } = useStepGuard("vehicle");
  const { update } = useBookingFlow();
  const { vehicle, quote, days } = useBookingQuote();
  const vehicles = useVehicleList();

  if (!ready || !days) return <StepSkeleton />;

  const sorted = vehicles.data ? [...vehicles.data].sort((a, b) => a.pricePerDay - b.pricePerDay) : [];
  const selected = sorted.find((option) => option.slug === state.vehicleSlug);
  const selectedUnavailable = selected !== undefined && selected.status !== "available";
  const canContinue = selected?.status === "available";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
        <StepHeading title={t.title} description={t.description} />

        {selectedUnavailable && <Alert variant="warning">{t.selectedUnavailable}</Alert>}

        <section aria-label={t.vehiclesLabel}>
          <h2 className="sr-only">{t.vehiclesLabel}</h2>
          {vehicles.isError ? (
            <ErrorState description={t.loadError} onRetry={() => vehicles.refetch()} />
          ) : vehicles.isPending ? (
            <div className="flex flex-col gap-4" aria-hidden="true">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {sorted.map((option) => (
                <li key={option.id}>
                  <VehicleOption
                    vehicle={option}
                    available={option.status === "available"}
                    days={days}
                    selected={option.slug === state.vehicleSlug}
                    onSelect={() => update({ vehicleSlug: option.slug })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <StepActions backHref={previousStepPath("vehicle")}>
          {!canContinue && !selectedUnavailable && <p className="self-center text-sm text-muted">{t.selectPrompt}</p>}
          {canContinue ? (
            <Button asChild size="lg">
              <Link href={nextStepPath("vehicle")}>{content.booking.common.continue}</Link>
            </Button>
          ) : (
            <Button size="lg" disabled>
              {content.booking.common.continue}
            </Button>
          )}
        </StepActions>
      </div>

      <aside className="min-w-0 lg:col-span-1">
        <BookingSummary
          data={summaryFromFlow({ state, vehicle, quote })}
          className="lg:sticky lg:top-24"
        />
      </aside>
    </div>
  );
}
