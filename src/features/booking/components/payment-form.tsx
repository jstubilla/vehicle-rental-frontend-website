import { useState } from "react";
import { Alert, Button, Card, CardContent, Checkbox, FieldGroup, NewTabLink, Price, RadioGroup } from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
import { ONLINE_PAYMENT_METHODS, PAYMENT_METHODS, type OnlinePaymentMethod, type PaymentMethod } from "@/lib/constants";
import { splitDownPayment } from "@/lib/pricing";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import type { PayBookingState } from "../hooks/use-pay-booking";

const t = content.booking.payment;

/** "I agree to the rental terms", with its error. Used when sending the request and when paying. */
export function TermsCheckbox({
  accepted,
  showError,
  onChange,
}: {
  accepted: boolean;
  showError: boolean;
  onChange: (accepted: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        label={
          <>
            {t.termsLead}
            <NewTabLink href="/terms">{t.termsLink}</NewTabLink>
          </>
        }
        checked={accepted}
        aria-invalid={showError && !accepted ? true : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      {showError && !accepted && (
        <p role="alert" className="text-sm font-medium text-danger">
          {t.termsError}
        </p>
      )}
    </div>
  );
}

/** Explains what will happen for the chosen method. No card fields: card data never touches this site. */
function MethodNotice({ method }: { method: OnlinePaymentMethod }) {
  const text = method === "card" ? t.cardNotice : t.redirectNotice(content.enums.paymentMethod[method]);
  return <p className="rounded-md bg-surface-muted p-4 text-sm">{text}</p>;
}

/** "Pay at pick-up": what is paid now and at pick-up, and how the down payment is paid. */
function DownPaymentPanel({
  total,
  method,
  onMethodChange,
  disabled,
}: {
  total: number;
  method: OnlinePaymentMethod;
  onMethodChange: (method: OnlinePaymentMethod) => void;
  disabled: boolean;
}) {
  const { downPayment, balance } = splitDownPayment(total);
  return (
    <section aria-labelledby="down-payment-heading" className="flex flex-col gap-5 rounded-md border border-border p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="down-payment-heading" className="text-lg">
          {t.downPayment.title}
        </h2>
        <p className="text-sm text-muted">{t.downPayment.description}</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-md bg-surface-muted p-4">
          <dt className="text-sm text-muted">{t.downPayment.dueNow}</dt>
          <dd>
            <Price amount={downPayment} size="lg" exact />
          </dd>
        </div>
        <div className="flex flex-col gap-1 rounded-md border border-border p-4">
          <dt className="text-sm text-muted">{t.downPayment.dueAtPickup}</dt>
          <dd>
            <Price amount={balance} size="lg" tone="plain" exact />
          </dd>
        </div>
      </dl>

      <FieldGroup label={t.downPayment.methodLabel}>
        <RadioGroup
          name="down-payment-method"
          value={method}
          onValueChange={(value) => onMethodChange(value as OnlinePaymentMethod)}
          options={ONLINE_PAYMENT_METHODS.map((value) => ({
            value,
            label: t.methods[value].label,
            disabled,
          }))}
        />
      </FieldGroup>

      <MethodNotice method={method} />
    </section>
  );
}

/** Choosing how to pay and paying, on the pay page (after staff approve the documents). */
export function PaymentForm({ total, payment }: { total: number; payment: PayBookingState }) {
  const [accepted, setAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const busy = payment.isBusy;
  const payAtPickup = payment.method === "pay_at_pickup";
  const amount = formatCurrency(total);
  const downPayment = formatCurrency(splitDownPayment(total).downPayment);

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

  return (
    <div className="flex flex-col gap-6">
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

      {payAtPickup ? (
        <DownPaymentPanel
          total={total}
          method={payment.downPaymentMethod}
          onMethodChange={payment.selectDownPaymentMethod}
          disabled={busy}
        />
      ) : (
        <MethodNotice method={payment.method as OnlinePaymentMethod} />
      )}

      {SHOW_MOCK_CONTROLS && (
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

      <TermsCheckbox
        accepted={accepted}
        showError={showTermsError}
        onChange={(value) => {
          setAccepted(value);
          setShowTermsError(false);
        }}
      />

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
        </Alert>
      )}

      <div className="flex justify-end pt-2">
        <Button size="lg" variant="accent" loading={busy} onClick={onPay}>
          {payment.failure ? t.tryAgain : payAtPickup ? t.payDownPayment(downPayment) : t.pay(amount)}
        </Button>
      </div>
    </div>
  );
}
