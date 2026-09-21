"use client";

import { Button, FormField, Input, Textarea } from "@/components/ui";
import { content } from "@/content";
import { useBookingLocations } from "../hooks/use-locations";
import { useBookingQuote } from "../hooks/use-booking-quote";
import { useDetailsStep } from "../hooks/use-details-step";
import { useStepGuard } from "../hooks/use-step-guard";
import type { FlowState } from "../flow-store";
import type { DetailsFormValues } from "../schemas";
import { previousStepPath } from "../steps";
import { summaryFromFlow } from "../summary";
import { BookingSummary } from "./booking-summary";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.details;

export function DetailsStep() {
  const { ready, state } = useStepGuard("details");
  if (!ready) return <StepSkeleton />;

  const initial: DetailsFormValues = state.customer ?? {
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    notes: "",
  };
  return <DetailsForm initial={initial} state={state} />;
}

function DetailsForm({ initial, state }: { initial: DetailsFormValues; state: FlowState }) {
  const locations = useBookingLocations();
  const { vehicle, quote } = useBookingQuote();
  const { form, onSubmit } = useDetailsStep(initial);
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-col gap-6 lg:col-span-2">
        <StepHeading title={t.title} description={t.description} />

        <FormField label={t.name} required error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t.email} required error={errors.email?.message}>
            <Input {...register("email")} type="email" autoComplete="email" />
          </FormField>
          <FormField label={t.phone} required hint={t.phoneHint} error={errors.phone?.message}>
            <Input {...register("phone")} type="tel" autoComplete="tel" />
          </FormField>
        </div>

        <FormField label={t.license} required hint={t.licenseHint} error={errors.licenseNumber?.message}>
          <Input {...register("licenseNumber")} autoComplete="off" />
        </FormField>

        <FormField label={t.notes}>
          <Textarea {...register("notes")} />
        </FormField>

        <StepActions backHref={previousStepPath("details")}>
          <Button type="submit" size="lg">
            {content.booking.common.continue}
          </Button>
        </StepActions>
      </form>

      <aside className="min-w-0 lg:col-span-1">
        <BookingSummary
          data={summaryFromFlow({ state, vehicle, quote, locations })}
          className="lg:sticky lg:top-24"
        />
      </aside>
    </div>
  );
}
