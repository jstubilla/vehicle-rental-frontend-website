"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { content } from "@/content";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useStepGuard } from "../hooks/use-step-guard";
import { BOOKING_STEPS, nextStepPath, previousStepPath, stepIndex } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.check;

/** Step 4: a last check of everything before paying. Nothing is charged or booked here. */
export function CheckStep() {
  const { ready, state } = useStepGuard("check");
  const { vehicle, quote } = useBookingQuote();

  if (!ready || !quote) return <StepSkeleton />;

  return (
    <div className="flex max-w-narrow flex-col gap-6">
      <StepHeading title={t.title} description={t.description} />

      <BookingSummary data={summaryFromFlow({ state, vehicle, quote })} />

      <nav aria-label={t.title}>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {BOOKING_STEPS.slice(0, stepIndex("check")).map((step) => (
            <li key={step.id}>
              <Button asChild variant="link" size="sm">
                <Link href={step.path}>
                  {content.booking.common.edit}: {content.booking.steps[step.id]}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <StepActions backHref={previousStepPath("check")}>
        <Button asChild size="lg">
          <Link href={nextStepPath("check")}>{t.toPayment}</Link>
        </Button>
      </StepActions>
    </div>
  );
}
