"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { payForBooking } from "@/api/bookings";
import { ApiError } from "@/api/client";
import type { PaymentFailureCode } from "@/api/payments";
import { ownBookingsKey } from "@/features/account/hooks/use-account";
import type { OnlinePaymentMethod, PaymentMethod } from "@/lib/constants";
import { confirmationPath } from "../steps";

/** The pay page: choose how to pay, then pay and confirm the approved booking in one action. */
export function usePayBooking(reference: string, email: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [method, setMethod] = useState<PaymentMethod>("card");
  /** "Pay at pick-up" only: how the down payment is paid now. */
  const [downPaymentMethod, setDownPaymentMethod] = useState<OnlinePaymentMethod>("card");
  const [mockOutcome, setMockOutcome] = useState<"success" | "decline">("success");

  const mutation = useMutation({
    mutationFn: payForBooking,
    onSuccess: (result) => {
      if (result.status !== "paid") return;
      queryClient.invalidateQueries({ queryKey: ["booking", result.booking.reference] });
      queryClient.invalidateQueries({ queryKey: ownBookingsKey });
      router.push(confirmationPath(result.booking.reference));
    },
  });

  const failure: PaymentFailureCode | null = mutation.data?.status === "payment_failed" ? mutation.data.failureCode : null;
  const error = mutation.error ? (mutation.error instanceof ApiError ? mutation.error : new ApiError("Unknown")) : null;

  return {
    method,
    /** Picking another method clears a failed attempt so the customer can try again. */
    selectMethod: (next: PaymentMethod) => {
      setMethod(next);
      mutation.reset();
    },
    downPaymentMethod,
    selectDownPaymentMethod: (next: OnlinePaymentMethod) => {
      setDownPaymentMethod(next);
      mutation.reset();
    },
    mockOutcome,
    setMockOutcome,
    /** Stays true after success, while the page moves on to the confirmation. */
    isBusy: mutation.isPending || mutation.data?.status === "paid",
    /** Why the payment did not go through (nothing was charged), or null. */
    failure,
    /** Why the booking could not be paid (nothing was charged), or null. */
    error,
    pay: () => mutation.mutate({ reference, email, method, downPaymentMethod, mockOutcome }),
  };
}

export type PayBookingState = ReturnType<typeof usePayBooking>;
