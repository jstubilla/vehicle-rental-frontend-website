"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Checkbox } from "@/components/ui";
import { content } from "@/content";
import { useBookingLocations } from "../hooks/use-locations";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useConfirmBooking } from "../hooks/use-confirm-booking";
import { useStepGuard } from "../hooks/use-step-guard";
import { BOOKING_STEPS, previousStepPath, stepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.review;

/** Where to send the visitor to fix each kind of problem. */
const ERROR_ACTION_PATH = {
  vehicle_unavailable: stepPath("vehicle"),
  not_found: stepPath("vehicle"),
  price_changed: stepPath("payment"),
  unknown: null,
} as const;

export function ReviewStep() {
  const { vehicle, quote } = useBookingQuote();
  const { ready, state } = useStepGuard("review", quote?.total);
  const locations = useBookingLocations();
  const { confirm, isConfirming, error } = useConfirmBooking();
  const [accepted, setAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  if (!ready || !quote) return <StepSkeleton />;

  function onConfirm() {
    if (!accepted) {
      setShowTermsError(true);
      return;
    }
    confirm();
  }

  // Any error the page has no specific message for shows the generic one.
  const errorKey: keyof typeof t.errors | null = error
    ? error.code in t.errors
      ? (error.code as keyof typeof t.errors)
      : "unknown"
    : null;
  const errorText = errorKey ? t.errors[errorKey] : null;
  const errorPath = errorKey ? ERROR_ACTION_PATH[errorKey] : null;

  return (
    <div className="flex max-w-narrow flex-col gap-6">
      <StepHeading title={t.title} description={t.description} />

      <BookingSummary data={summaryFromFlow({ state, vehicle, quote, locations })} />

      <nav aria-label={t.title}>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {BOOKING_STEPS.filter((step) => step.id !== "review").map((step) => (
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

      <div className="flex flex-col gap-1">
        <Checkbox
          label={t.terms}
          checked={accepted}
          aria-invalid={showTermsError && !accepted ? true : undefined}
          onChange={(e) => {
            setAccepted(e.target.checked);
            setShowTermsError(false);
          }}
        />
        {showTermsError && !accepted && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t.termsError}
          </p>
        )}
      </div>

      {errorText && (
        <Alert variant="danger" title={errorText.title}>
          {errorText.body}
          {errorPath && errorText.action && (
            <p className="mt-2">
              <Button asChild variant="outline" size="sm">
                <Link href={errorPath}>{errorText.action}</Link>
              </Button>
            </p>
          )}
        </Alert>
      )}

      <StepActions backHref={previousStepPath("review")}>
        <Button size="lg" loading={isConfirming} onClick={onConfirm}>
          {isConfirming ? t.confirming : t.confirm}
        </Button>
      </StepActions>
    </div>
  );
}
