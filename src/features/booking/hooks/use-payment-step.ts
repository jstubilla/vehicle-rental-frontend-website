"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBooking } from "@/api/bookings";
import { ApiError } from "@/api/client";
import type { PaymentFailureCode } from "@/api/payments";
import { vehicleKeys } from "@/features/vehicles/hooks/use-vehicles";
import type { PaymentMethod } from "@/lib/constants";
import { confirmationPath } from "../steps";
import { useBookingFlow } from "./use-booking-flow";
import { useBookingQuote } from "./use-booking-quote";

/** The last step: choose how to pay, then pay and confirm the booking in one action. */
export function usePaymentStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state } = useBookingFlow();
  const { vehicle, quote } = useBookingQuote();

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [mockOutcome, setMockOutcome] = useState<"success" | "decline">("success");

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (result) => {
      if (result.status !== "confirmed") return;
      router.push(confirmationPath(result.booking.reference));
    },
    onError: (error) => {
      // Reload the vehicle so the price shown is the current one.
      if (error instanceof ApiError && error.code === "price_changed") {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      }
    },
  });

  const failure: PaymentFailureCode | null = mutation.data?.status === "payment_failed" ? mutation.data.failureCode : null;
  const error = mutation.error ? (mutation.error instanceof ApiError ? mutation.error : new ApiError("Unknown")) : null;

  return {
    method,
    /** Picking another method clears a failed attempt so the visitor can try again. */
    selectMethod: (next: PaymentMethod) => {
      setMethod(next);
      mutation.reset();
    },
    mockOutcome,
    setMockOutcome,
    /** Stays true after success, while the page moves on to the confirmation. */
    isBusy: mutation.isPending || mutation.data?.status === "confirmed",
    /** Why the payment did not go through (nothing was booked), or null. */
    failure,
    /** Why the booking could not be made (nothing was charged), or null. */
    error,
    pay: () => {
      const { rental, customer } = state;
      if (!rental || !vehicle || !customer || !quote) return;
      mutation.mutate({
        vehicleId: vehicle.id,
        pickupLocation: rental.pickupLocation,
        returnLocation: rental.returnLocation,
        pickupDate: rental.pickupDate,
        pickupTime: rental.pickupTime,
        returnDate: rental.returnDate,
        returnTime: rental.returnTime,
        customer,
        payment: { method, mockOutcome },
        expectedTotal: quote.total,
      });
    },
  };
}
