"use client";

import { Controller } from "react-hook-form";
import { Button, DatePicker, FormField, Input, TimeSelect } from "@/components/ui";
import { content } from "@/content";
import { todayISO } from "@/lib/dates";
import { useQuickSearch } from "./use-quick-search";

/**
 * Pick-up place, pick-up and return date/time: the home page's booking bar. On wide screens the place
 * spans the top and the dates row ends in the search button (pick-up | return | search); stacked on
 * phones. It is raised above the page (shadow-float) because it is the first thing to do here.
 */
export function QuickSearch() {
  const t = content.quickSearch;
  const { form, onSubmit, changePickupDate, isSubmitting } = useQuickSearch();
  const { control, register, watch, formState } = form;
  const { errors } = formState;
  const pickupDate = watch("pickupDate");

  return (
    <section
      aria-labelledby="quick-search-heading"
      className="rounded-lg border border-border bg-card p-4 shadow-float sm:p-5"
    >
      <h2 id="quick-search-heading" className="sr-only">
        {t.title}
      </h2>
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:gap-x-4"
      >
        <FormField
          label={t.pickupLocation}
          required
          error={errors.pickupLocation?.message}
          hint={t.locationHint}
          className="sm:col-span-2 lg:col-span-3"
        >
          <Input {...register("pickupLocation")} placeholder={t.locationPlaceholder} />
        </FormField>

        <div className="grid grid-cols-2 gap-2">
          <FormField label={t.pickupDate} required error={errors.pickupDate?.message}>
            <Controller
              control={control}
              name="pickupDate"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={changePickupDate} min={todayISO()} />
              )}
            />
          </FormField>
          <FormField label={t.pickupTime} required>
            <Controller
              control={control}
              name="pickupTime"
              render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-2">
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

        {/* On wide screens the button closes the dates row, lined up with the inputs below their labels. */}
        <div className="sm:col-span-2 lg:col-span-1 lg:pt-7">
          <Button type="submit" size="lg" variant="accent" arrow className="w-full lg:px-7" loading={isSubmitting}>
            {t.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
