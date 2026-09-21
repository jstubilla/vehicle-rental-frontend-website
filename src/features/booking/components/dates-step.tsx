"use client";

import { useSearchParams } from "next/navigation";
import { Controller } from "react-hook-form";
import { Button, Checkbox, DatePicker, FormField, Select, TimeSelect } from "@/components/ui";
import { content } from "@/content";
import { todayISO } from "@/lib/dates";
import {
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  defaultRentalDates,
  parseRentalSearch,
} from "@/lib/rental";
import type { Location } from "@/types";
import { useBookingFlow } from "../hooks/use-booking-flow";
import { useBookingLocations } from "../hooks/use-locations";
import { useDatesStep } from "../hooks/use-dates-step";
import type { DatesFormValues } from "../schemas";
import { StepActions, StepHeading, StepSkeleton } from "./step-parts";

const t = content.booking.dates;

/** Works out what the form starts with: dates from the link, else saved answers, else defaults. */
function useInitialValues(): { initial: DatesFormValues; vehicleFromUrl: string | null } | null {
  const { state, hydrated } = useBookingFlow();
  const searchParams = useSearchParams();
  if (!hydrated) return null;

  const fromUrl = parseRentalSearch(searchParams);
  const saved = state.rental;
  const defaults = defaultRentalDates();

  // The return location starts empty when it is the same as pick-up, so choosing
  // "a different location" makes the visitor actually pick one.
  const initial: DatesFormValues = fromUrl
    ? { ...fromUrl, returnLocation: "", sameReturn: true }
    : saved
      ? {
          ...saved,
          sameReturn: saved.returnLocation === saved.pickupLocation,
          returnLocation: saved.returnLocation === saved.pickupLocation ? "" : saved.returnLocation,
        }
      : {
          pickupLocation: "",
          returnLocation: "",
          sameReturn: true,
          pickupDate: defaults.pickupDate,
          pickupTime: DEFAULT_PICKUP_TIME,
          returnDate: defaults.returnDate,
          returnTime: DEFAULT_RETURN_TIME,
        };

  return { initial, vehicleFromUrl: searchParams.get("vehicle") };
}

export function DatesStep() {
  const start = useInitialValues();
  if (!start) return <StepSkeleton />;
  return <DatesForm initial={start.initial} vehicleFromUrl={start.vehicleFromUrl} />;
}

function DatesForm({ initial, vehicleFromUrl }: { initial: DatesFormValues; vehicleFromUrl: string | null }) {
  const locations: Location[] = useBookingLocations();
  const { form, onSubmit, changePickupDate } = useDatesStep(initial, vehicleFromUrl);
  const { control, register, watch, formState } = form;
  const { errors } = formState;
  const pickupDate = watch("pickupDate");
  const sameReturn = watch("sameReturn");

  const locationOptions = (
    <>
      <option value="">{t.locationPlaceholder}</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name}
        </option>
      ))}
    </>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-narrow flex-col gap-6">
      <StepHeading title={t.title} description={t.description} />

      <FormField label={t.pickupLocation} required error={errors.pickupLocation?.message}>
        <Select {...register("pickupLocation")}>{locationOptions}</Select>
      </FormField>

      {/* The form stores "same location"; the checkbox asks the opposite question. */}
      <Controller
        control={control}
        name="sameReturn"
        render={({ field }) => (
          <Checkbox
            label={t.differentReturn}
            checked={!field.value}
            onChange={(e) => field.onChange(!e.target.checked)}
          />
        )}
      />

      {!sameReturn && (
        <FormField label={t.returnLocation} required error={errors.returnLocation?.message}>
          <Select {...register("returnLocation")}>{locationOptions}</Select>
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.pickupDate} required error={errors.pickupDate?.message}>
          <Controller
            control={control}
            name="pickupDate"
            render={({ field }) => <DatePicker value={field.value} onChange={changePickupDate} min={todayISO()} />}
          />
        </FormField>
        <FormField label={t.pickupTime} required>
          <Controller
            control={control}
            name="pickupTime"
            render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
          />
        </FormField>
        <FormField label={t.returnDate} required error={errors.returnDate?.message}>
          <Controller
            control={control}
            name="returnDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} min={pickupDate || todayISO()} />
            )}
          />
        </FormField>
        <FormField label={t.returnTime} required>
          <Controller
            control={control}
            name="returnTime"
            render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
          />
        </FormField>
      </div>

      <StepActions>
        <Button type="submit" size="lg">
          {content.booking.common.continue}
        </Button>
      </StepActions>
    </form>
  );
}
