"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { addDaysISO } from "@/lib/dates";
import {
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  defaultRentalDates,
  rentalSearchSchema,
  rentalSearchToParams,
  type RentalSearch,
} from "@/lib/rental";

/**
 * Logic for the home page quick search. Validates the trip, then opens the
 * vehicle catalog with the dates in the URL so they carry through to booking.
 */
export function useQuickSearch() {
  const router = useRouter();
  const [defaults] = useState(defaultRentalDates);

  const form = useForm<RentalSearch>({
    resolver: zodResolver(rentalSearchSchema),
    defaultValues: {
      pickupLocation: "",
      pickupDate: defaults.pickupDate,
      pickupTime: DEFAULT_PICKUP_TIME,
      returnDate: defaults.returnDate,
      returnTime: DEFAULT_RETURN_TIME,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    router.push(`/vehicles?${rentalSearchToParams(values)}#vehicle-results`);
  });

  /** Moving the pick-up date past the return date pushes the return date to the next day. */
  function changePickupDate(date: string) {
    form.setValue("pickupDate", date, { shouldValidate: form.formState.isSubmitted });
    if (form.getValues("returnDate") <= date) {
      form.setValue("returnDate", addDaysISO(date, 1));
    }
  }

  return { form, onSubmit, changePickupDate, isSubmitting: form.formState.isSubmitting };
}
