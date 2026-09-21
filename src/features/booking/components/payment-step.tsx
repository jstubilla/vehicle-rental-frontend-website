"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, FieldGroup, RadioGroup } from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import { useBookingLocations } from "../hooks/use-locations";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { usePaymentStep } from "../hooks/use-payment-step";
import { useStepGuard } from "../hooks/use-step-guard";
import { nextStepPath, previousStepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.payment;

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

export function PaymentStep() {
  const { ready, state } = useStepGuard("payment");
  const locations = useBookingLocations();
  const { vehicle, quote } = useBookingQuote();
  const total = quote?.total ?? null;
  const payment = usePaymentStep(total);

  if (!ready || total === null) return <StepSkeleton />;

  const busy = payment.status === "processing";
  const finished = payment.status === "paid" || payment.status === "pending";
  const amount = formatCurrency(total);

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
              disabled: busy || finished,
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
                    { value: "success", label: t.demo.success, disabled: busy || finished },
                    { value: "decline", label: t.demo.decline, disabled: busy || finished },
                  ]}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {busy && (
          <Alert variant="info" title={content.ui.loading}>
            {t.processing}
          </Alert>
        )}

        {payment.status === "paid" && (
          <Alert variant="success" title={t.successTitle}>
            {t.successBody(amount)}
          </Alert>
        )}

        {payment.status === "pending" && (
          <Alert variant="info" title={t.pickupTitle}>
            {t.pickupBody}
          </Alert>
        )}

        {payment.status === "failed" && (
          <Alert variant="danger" title={t.failedTitle}>
            {payment.result?.failureCode ? t.failureReasons[payment.result.failureCode] : null}
          </Alert>
        )}

        <StepActions backHref={previousStepPath("payment")}>
          {finished ? (
            <>
              <Button variant="outline" onClick={payment.changeMethod}>
                {t.changeMethod}
              </Button>
              <Button asChild size="lg">
                <Link href={nextStepPath("payment")}>{t.continueToReview}</Link>
              </Button>
            </>
          ) : (
            <Button size="lg" loading={busy} onClick={payment.pay}>
              {payment.method === "pay_at_pickup"
                ? t.choosePickup
                : payment.status === "failed"
                  ? t.tryAgain
                  : t.pay(amount)}
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
