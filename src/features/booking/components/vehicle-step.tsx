"use client";

import Link from "next/link";
import { Alert, Button, Checkbox, ErrorState, FieldGroup, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
import { useAvailableVehicles } from "../hooks/use-available-vehicles";
import { useBookingFlow } from "../hooks/use-booking-flow";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useBookingLocations } from "../hooks/use-locations";
import { useStepGuard } from "../hooks/use-step-guard";
import { nextStepPath, previousStepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";
import { VehicleOption } from "./vehicle-option";

const t = content.booking.vehicle;

export function VehicleStep() {
  const { ready, state } = useStepGuard("vehicle");
  const { update } = useBookingFlow();
  const locations = useBookingLocations();
  const { vehicle, allExtras, quote, days } = useBookingQuote();
  const availability = useAvailableVehicles(ready ? state.rental : null);

  if (!ready || !days) return <StepSkeleton />;

  const selected = availability.data?.find((item) => item.vehicle.slug === state.vehicleSlug);
  const selectedUnavailable = selected !== undefined && !selected.available;
  const canContinue = selected?.available === true;

  function toggleExtra(extraId: string, on: boolean) {
    const extraIds = on ? [...state.extraIds, extraId] : state.extraIds.filter((id) => id !== extraId);
    update({ extraIds, payment: null });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
        <StepHeading title={t.title} description={t.description} />

        {selectedUnavailable && <Alert variant="warning">{t.selectedUnavailable}</Alert>}

        <section aria-label={t.vehiclesLabel}>
          <h2 className="sr-only">{t.vehiclesLabel}</h2>
          {availability.isError ? (
            <ErrorState description={t.loadError} onRetry={() => availability.refetch()} />
          ) : availability.isPending ? (
            <div className="flex flex-col gap-4" aria-hidden="true">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {availability.data.map(({ vehicle: option, available }) => (
                <li key={option.id}>
                  <VehicleOption
                    vehicle={option}
                    available={available}
                    days={days}
                    selected={option.slug === state.vehicleSlug}
                    onSelect={() => update({ vehicleSlug: option.slug, payment: null })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <FieldGroup label={t.extrasTitle} hint={t.extrasDescription}>
          {allExtras.map((extra) => (
            <Checkbox
              key={extra.id}
              label={`${extra.name} (${formatCurrency(extra.price)} ${extra.pricing === "per_day" ? t.extraPerDay : t.extraFlat})`}
              description={extra.description}
              checked={state.extraIds.includes(extra.id)}
              onChange={(e) => toggleExtra(extra.id, e.target.checked)}
            />
          ))}
        </FieldGroup>

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
          data={summaryFromFlow({ state, vehicle, quote, locations })}
          className="lg:sticky lg:top-24"
        />
      </aside>
    </div>
  );
}
