"use client";

import { useVehicle } from "@/features/vehicles/hooks/use-vehicles";
import { buildQuote } from "@/lib/pricing";
import { countRentalDays } from "@/lib/rental";
import { useBookingFlow } from "./use-booking-flow";

/** The selected vehicle and the price so far, worked out from the booking in progress. */
export function useBookingQuote() {
  const { state } = useBookingFlow();
  const vehicleQuery = useVehicle(state.vehicleSlug);

  const vehicle = vehicleQuery.data ?? null;
  const days = state.rental ? countRentalDays(state.rental) : null;
  const quote = vehicle && days ? buildQuote({ dailyRate: vehicle.pricePerDay, days }) : null;

  return {
    vehicle,
    days,
    quote,
    isLoading: state.vehicleSlug !== null && vehicleQuery.isPending,
  };
}
