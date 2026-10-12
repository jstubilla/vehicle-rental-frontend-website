"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { content } from "@/content";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useStepGuard } from "../hooks/use-step-guard";
import { useSubmitStep } from "../hooks/use-submit-step";
import { previousStepPath, stepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { TermsCheckbox } from "./payment-form";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.submit;

/** Where to send the visitor to fix each kind of problem. */
const ERROR_ACTION_PATH = {
  not_found: stepPath("vehicle"),
  price_changed: stepPath("check"),
  unknown: null,
} as const;

/** Step 5, the last one: send the booking request. Paying comes later, once staff approve the documents. */
export function SubmitStep() {
  const { ready, state } = useStepGuard("submit");
  const { vehicle, quote } = useBookingQuote();
  const request = useSubmitStep();
  const [accepted, setAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  if (!ready || !quote) return <StepSkeleton />;

  function onSend() {
    if (!accepted) {
      setShowTermsError(true);
      return;
    }
    request.submit();
  }

  // Any error the page has no specific message for shows the generic one.
  const errorKey: keyof typeof t.errors | null = request.error
    ? request.error.code in t.errors
      ? (request.error.code as keyof typeof t.errors)
      : "unknown"
    : null;
  const errorText = errorKey ? t.errors[errorKey] : null;
  const errorPath = errorKey ? ERROR_ACTION_PATH[errorKey] : null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <StepHeading title={t.title} description={t.description} />

        <section aria-labelledby="next-heading" className="flex flex-col gap-2">
          <h2 id="next-heading" className="text-lg">
            {t.stepsTitle}
          </h2>
          <ol className="ledger">
            {t.steps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-4 py-3">
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

        <TermsCheckbox
          accepted={accepted}
          showError={showTermsError}
          onChange={(value) => {
            setAccepted(value);
            setShowTermsError(false);
          }}
        />

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

        <StepActions backHref={previousStepPath("submit")}>
          <Button size="lg" variant="accent" loading={request.isBusy} onClick={onSend}>
            {t.send}
          </Button>
        </StepActions>
      </div>

      <aside className="order-first min-w-0 lg:order-none lg:col-span-1">
        <BookingSummary
          data={summaryFromFlow({ state, vehicle, quote })}
          collapsible
          className="lg:sticky lg:top-24"
        />
      </aside>
    </div>
  );
}
