"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { submitInquiry } from "@/api/contact";
import { contactFormSchema, type ContactFormValues } from "./schemas";

/** Logic for the contact form: validation, submitting, and the success / error states. */
export function useContactForm(defaultVehicleId = "") {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      vehicleId: defaultVehicleId,
      message: "",
      consent: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ContactFormValues) =>
      submitInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        vehicleId: values.vehicleId || null,
        message: values.message,
      }),
    onSuccess: () => form.reset(),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return {
    form,
    onSubmit,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    /** Go back to a fresh form after a success message. */
    startOver: () => mutation.reset(),
  };
}
