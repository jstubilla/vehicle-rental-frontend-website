"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { addDaysISO } from "@/lib/dates";
import { datesFormSchema, type DatesFormValues } from "../schemas";
import { nextStepPath } from "../steps";
import { useBookingFlow } from "./use-booking-flow";

/** Step 1: where and when. Saves the answers into the booking and moves to step 2. */
export function useDatesStep(initial: DatesFormValues, vehicleFromUrl: string | null) {
  const router = useRouter();
  const { state, update } = useBookingFlow();

  const form = useForm<DatesFormValues>({
    resolver: zodResolver(datesFormSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit((values) => {
    update({
      rental: {
        pickupLocation: values.pickupLocation,
        returnLocation: values.sameReturn ? values.pickupLocation : values.returnLocation,
        pickupDate: values.pickupDate,
        pickupTime: values.pickupTime,
        returnDate: values.returnDate,
        returnTime: values.returnTime,
      },
      // A vehicle chosen on the catalog (?vehicle=slug) is kept.
      vehicleSlug: vehicleFromUrl ?? state.vehicleSlug,
    });
    router.push(nextStepPath("dates"));
  });

  /** Moving the pick-up date past the return date pushes the return date to the next day. */
  function changePickupDate(date: string) {
    form.setValue("pickupDate", date, { shouldValidate: form.formState.isSubmitted });
    if (form.getValues("returnDate") <= date) {
      form.setValue("returnDate", addDaysISO(date, 1));
    }
  }

  return { form, onSubmit, changePickupDate };
}
