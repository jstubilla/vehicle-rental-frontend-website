"use client";

import { Controller } from "react-hook-form";
import { Alert, Button, Checkbox, FormField, Input, Select, Textarea } from "@/components/ui";
import { content } from "@/content";
import { PrivacyNote } from "@/features/shared/privacy-note";
import { useVehicleList } from "@/features/vehicles/hooks/use-vehicles";
import { useContactForm } from "./use-contact-form";

/** Inquiry form. Submitting creates a lead in the CRM (see /src/api/contact.ts). */
export function ContactForm({ defaultVehicleId }: { defaultVehicleId?: string }) {
  const t = content.contact.form;
  const { form, onSubmit, isSubmitting, isSuccess, isError, startOver } = useContactForm(defaultVehicleId);
  const { register, control, formState } = form;
  const { errors } = formState;
  const vehicles = useVehicleList();

  if (isSuccess) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert variant="success" title={t.successTitle}>
          {t.successBody}
        </Alert>
        <Button variant="outline" onClick={startOver}>
          {t.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {isError && (
        <Alert variant="danger" title={t.errorTitle}>
          {t.errorBody}
        </Alert>
      )}

      {/* Name and email pair up; the mobile number gets the full width so its hint stays on one line. */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-4">
        <FormField label={t.name} required error={errors.name?.message}>
          <Input {...register("name")} autoComplete="name" />
        </FormField>
        <FormField label={t.email} required error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="email" />
        </FormField>
      </div>

      <FormField label={t.phone} required hint={t.phoneHint} error={errors.phone?.message}>
        <Input {...register("phone")} type="tel" autoComplete="tel" />
      </FormField>

      <FormField label={t.vehicle}>
        {/* Controlled, because the options arrive after the form starts and must not lose the preselected value. */}
        <Controller
          control={control}
          name="vehicleId"
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={vehicles.isPending}
            >
              <option value="">{vehicles.isPending ? t.vehiclesLoading : t.vehicleNone}</option>
              {vehicles.data?.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </Select>
          )}
        />
      </FormField>

      <FormField label={t.message} required error={errors.message?.message}>
        <Textarea {...register("message")} />
      </FormField>

      {/* Consent and the privacy note read as one group; the send button closes the form. */}
      <div className="flex flex-col gap-2">
        <Checkbox {...register("consent")} label={t.consent} aria-invalid={errors.consent ? true : undefined} />
        {errors.consent && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.consent.message}
          </p>
        )}
        {/* Indented to start under the checkbox's label text, not its box. */}
        <PrivacyNote className="pl-8 text-sm text-muted" />
      </div>

      <Button
        type="submit"
        size="lg"
        variant="accent"
        loading={isSubmitting}
        className="mt-1 w-full sm:w-auto sm:self-start"
      >
        {isSubmitting ? t.sending : t.submit}
      </Button>
    </form>
  );
}
