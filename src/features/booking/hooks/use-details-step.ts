"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAccount } from "@/features/account/hooks/use-account";
import { detailsFormSchema, type DetailsFormValues } from "../schemas";
import { nextStepPath } from "../steps";
import { useBookingFlow } from "./use-booking-flow";

/**
 * Step 3: who is driving. Saves the answers into the booking and moves to payment.
 * `alreadyFilled` is true when the visitor comes back to this step: no need to ask again.
 */
export function useDetailsStep(initial: DetailsFormValues, alreadyFilled: boolean) {
  const router = useRouter();
  const { update } = useBookingFlow();
  const { data: account, isSuccess: accountChecked } = useAccount();
  const [answered, setAnswered] = useState(false);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit((values) => {
    update({ customer: values });
    router.push(nextStepPath("details"));
  });

  /** "offer": a signed-in customer is asked; "login": a signed-out visitor is told they can log in. */
  const savedDetails = alreadyFilled || !accountChecked || answered ? null : account ? "offer" : "login";

  /** Answer to "Use your saved details?". Focus goes to the first field, since the question disappears. */
  function answerSavedDetails(useThem: boolean) {
    if (useThem && account) {
      const options = { shouldDirty: true };
      form.setValue("name", account.name, options);
      form.setValue("email", account.email, options);
      form.setValue("phone", account.phone, options);
      form.setValue("licenseNumber", account.licenseNumber, options);
    }
    setAnswered(true);
    form.setFocus("name");
  }

  return { form, onSubmit, savedDetails, answerSavedDetails };
}
