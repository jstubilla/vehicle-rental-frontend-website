"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBooking } from "@/api/bookings";
import { ApiError } from "@/api/client";
import { accountKey, ownBookingsKey } from "@/features/account/hooks/use-account";
import { vehicleKeys } from "@/features/vehicles/hooks/use-vehicles";
import { confirmationPath } from "../steps";
import { useBookingFlow } from "./use-booking-flow";
import { useBookingQuote } from "./use-booking-quote";

/** The last step: send the booking request with the documents. Nothing is charged here. */
export function useSubmitStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state } = useBookingFlow();
  const { vehicle, quote } = useBookingQuote();

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (details) => {
      // The confirmation page shows these straight away (with the renter's contact details, which the
      // public status page leaves out).
      queryClient.setQueryData(["booking", details.booking.reference], details);
      // A signed-in customer's phone and license were just saved to their account.
      queryClient.invalidateQueries({ queryKey: accountKey });
      queryClient.invalidateQueries({ queryKey: ownBookingsKey });
      router.push(confirmationPath(details.booking.reference));
    },
    onError: (error) => {
      // Reload the vehicle so the price shown is the current one.
      if (error instanceof ApiError && error.code === "price_changed") {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      }
    },
  });

  const error = mutation.error ? (mutation.error instanceof ApiError ? mutation.error : new ApiError("Unknown")) : null;

  return {
    /** Stays true after success, while the page moves on to the confirmation. */
    isBusy: mutation.isPending || mutation.isSuccess,
    /** Why the request could not be sent, or null. */
    error,
    submit: () => {
      const { rental, customer, documents } = state;
      if (!rental || !vehicle || !customer || !documents || !quote) return;
      mutation.mutate({
        vehicleId: vehicle.id,
        pickupLocation: rental.pickupLocation,
        returnLocation: rental.returnLocation,
        pickupDate: rental.pickupDate,
        pickupTime: rental.pickupTime,
        returnDate: rental.returnDate,
        returnTime: rental.returnTime,
        withDriver: quote.withDriver,
        customer,
        documents,
        expectedTotal: quote.total,
      });
    },
  };
}
