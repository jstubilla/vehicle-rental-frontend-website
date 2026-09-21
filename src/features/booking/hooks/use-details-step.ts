"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { detailsFormSchema, type DetailsFormValues } from "../schemas";
import { nextStepPath } from "../steps";
import { useBookingFlow } from "./use-booking-flow";

/** Step 3: who is driving. Saves the answers into the booking and moves to payment. */
export function useDetailsStep(initial: DetailsFormValues) {
  const router = useRouter();
  const { update } = useBookingFlow();

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit((values) => {
    update({ customer: values });
    router.push(nextStepPath("details"));
  });

  return { form, onSubmit };
}
