"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Card, CardContent, Checkbox, FieldGroup, RadioGroup } from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { usePaymentStep } from "../hooks/use-payment-step";
import { useStepGuard } from "../hooks/use-step-guard";
import { previousStepPath, stepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.payment;

/** Where to send the visitor to fix each kind of problem. */
const ERROR_ACTION_PATH = {
  not_found: stepPath("vehicle"),
  price_changed: stepPath("check"),
  unknown: null,
} as const;

/** Explains what will happen for the chosen method. No card fields: card data never touches this site. */
function MethodNotice({ method }: { method: PaymentMethod }) {
  const text =
    method === "card"
      ? t.cardNotice
      : method === "pay_at_pickup"
        ? t.pickupNotice
        : t.redirectNotice(content.enums.paymentMethod[method]);
  return <p className="rounded-md bg-surface-muted p-4 text-sm">{text}</p>;
}

/** Step 5, the last one: pay and confirm the booking in one action. */
export function PaymentStep() {
  const { ready, state } = useStepGuard("payment");
  const { vehicle, quote } = useBookingQuote();
  const payment = usePaymentStep();
  const [accepted, setAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  if (!ready || !quote) return <StepSkeleton />;

  const busy = payment.isBusy;
  const amount = formatCurrency(quote.total);

  function onPay() {
    if (!accepted) {
      setShowTermsError(true);
      return;
    }
    payment.pay();
  }

  // Any error the page has no specific message for shows the generic one.
  const errorKey: keyof typeof t.errors | null = payment.error
    ? payment.error.code in t.errors
      ? (payment.error.code as keyof typeof t.errors)
      : "unknown"
    : null;
  const errorText = errorKey ? t.errors[errorKey] : null;
  const errorPath = errorKey ? ERROR_ACTION_PATH[errorKey] : null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <StepHeading title={t.title} description={t.description} />

        <FieldGroup label={t.methodLabel}>
          <RadioGroup
            name="payment-method"
            variant="cards"
            value={payment.method}
            onValueChange={(value) => payment.selectMethod(value as PaymentMethod)}
            options={PAYMENT_METHODS.map((method) => ({
              value: method,
              label: t.methods[method].label,
              description: t.methods[method].description,
              disabled: busy,
            }))}
          />
        </FieldGroup>

        <MethodNotice method={payment.method} />

        {SHOW_MOCK_CONTROLS && payment.method !== "pay_at_pickup" && (
          <Card variant="muted">
            <CardContent className="pt-4 md:pt-6">
              <FieldGroup label={t.demo.title} hint={t.demo.description}>
                <RadioGroup
                  name="mock-outcome"
                  value={payment.mockOutcome}
                  onValueChange={(value) => payment.setMockOutcome(value as "success" | "decline")}
                  options={[
                    { value: "success", label: t.demo.success, disabled: busy },
                    { value: "decline", label: t.demo.decline, disabled: busy },
                  ]}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        )}

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

        {busy && (
          <Alert variant="info" title={content.ui.loading}>
            {t.processing}
          </Alert>
        )}

        {payment.failure && (
          <Alert variant="danger" title={t.failedTitle}>
            {t.failureReasons[payment.failure]}
          </Alert>
        )}

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

        <StepActions backHref={previousStepPath("payment")}>
          <Button size="lg" variant="accent" loading={busy} onClick={onPay}>
            {payment.method === "pay_at_pickup" ? t.confirmPickup : payment.failure ? t.tryAgain : t.pay(amount)}
          </Button>
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
