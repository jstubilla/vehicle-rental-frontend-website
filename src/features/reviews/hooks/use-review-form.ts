"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError } from "@/api/client";
import { submitReview } from "@/api/reviews";
import { content } from "@/content";
import { reviewFormSchema, type ReviewFormValues } from "../schemas";

/** Logic for the public review form: validation, sending, and the success / error states. */
export function useReviewForm() {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { name: "", rating: 0, comment: "", bookingReference: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) => submitReview(values),
    onSuccess: () => form.reset(),
    onError: (error) => {
      // A wrong reference is the customer's to fix, so it shows beside that field instead of as a page error.
      if (error instanceof ApiError && error.code === "unknown_booking") {
        form.setError("bookingReference", { message: content.reviews.form.unknownReference }, { shouldFocus: true });
      }
    },
  });

  const unknownReference = mutation.error instanceof ApiError && mutation.error.code === "unknown_booking";

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError && !unknownReference,
    startOver: () => mutation.reset(),
  };
}
