"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBooking } from "@/api/bookings";
import { ApiError } from "@/api/client";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { vehicleKeys } from "@/features/vehicles/hooks/use-vehicles";
import { confirmationPath } from "../steps";
import { availabilityKey } from "./use-available-vehicles";
import { useBookingFlow } from "./use-booking-flow";
import { useBookingQuote } from "./use-booking-quote";

/** Step 5: turns the booking in progress into a real booking. */
export function useConfirmBooking() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state } = useBookingFlow();
  const { vehicle, selectedExtras } = useBookingQuote();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      // Other visitors' availability is now out of date.
      queryClient.invalidateQueries({ queryKey: availabilityKey });
      router.push(confirmationPath(booking.reference));
    },
    onError: (error) => {
      // Reload vehicle data so the price shown is the current one. The visitor is then sent
      // back to pay again, so the explanation is a notification that survives the redirect.
      if (error instanceof ApiError && error.code === "price_changed") {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
        const message = content.booking.review.errors.price_changed;
        toast({ title: message.title, description: message.body, variant: "danger", duration: 10000 });
      }
    },
  });

  function confirm() {
    const { rental, customer, payment } = state;
    if (!rental || !vehicle || !customer || !payment) return;
    mutation.mutate({
      vehicleId: vehicle.id,
      pickupLocationId: rental.pickupLocation,
      returnLocationId: rental.returnLocation,
      pickupDate: rental.pickupDate,
      pickupTime: rental.pickupTime,
      returnDate: rental.returnDate,
      returnTime: rental.returnTime,
      extraIds: selectedExtras.map((extra) => extra.id),
      customer,
      payment,
    });
  }

  return {
    confirm,
    isConfirming: mutation.isPending || mutation.isSuccess,
    error: mutation.error instanceof ApiError ? mutation.error : mutation.error ? new ApiError("Unknown") : null,
  };
}
