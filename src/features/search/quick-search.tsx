"use client";

import { Controller } from "react-hook-form";
import { Button, Card, CardContent, DatePicker, FormField, Input, TimeSelect } from "@/components/ui";
import { content } from "@/content";
import { todayISO } from "@/lib/dates";
import { useQuickSearch } from "./use-quick-search";

/** Pick-up place, pick-up and return date/time. Used in the home page hero. */
export function QuickSearch() {
  const t = content.quickSearch;
  const { form, onSubmit, changePickupDate, isSubmitting } = useQuickSearch();
  const { control, register, watch, formState } = form;
  const { errors } = formState;
  const pickupDate = watch("pickupDate");

  return (
    <Card as="section" aria-labelledby="quick-search-heading">
      <CardContent className="pt-4 md:pt-6">
        <h2 id="quick-search-heading" className="mb-4 text-xl">
          {t.title}
        </h2>
        <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label={t.pickupLocation} required error={errors.pickupLocation?.message} hint={t.locationHint}>
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

          <div className="flex items-end">
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {t.submit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
