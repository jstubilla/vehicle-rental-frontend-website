"use client";

import { useQuery } from "@tanstack/react-query";
import { listExtras } from "@/api/extras";
import { useVehicle } from "@/features/vehicles/hooks/use-vehicles";
import { buildQuote } from "@/lib/pricing";
import { countRentalDays } from "@/lib/rental";
import { useBookingFlow } from "./use-booking-flow";

export function useExtras() {
  return useQuery({ queryKey: ["extras"], queryFn: listExtras, staleTime: Infinity });
}

/** The selected vehicle, extras and the price so far, worked out from the booking in progress. */
export function useBookingQuote() {
  const { state } = useBookingFlow();
  const vehicleQuery = useVehicle(state.vehicleSlug);
  const extrasQuery = useExtras();

  const vehicle = vehicleQuery.data ?? null;
  const allExtras = extrasQuery.data ?? [];
  const selectedExtras = allExtras.filter((extra) => state.extraIds.includes(extra.id));
  const days = state.rental ? countRentalDays(state.rental) : null;
  const quote =
    vehicle && days ? buildQuote({ dailyRate: vehicle.pricePerDay, days, extras: selectedExtras }) : null;

  return {
    vehicle,
    allExtras,
    selectedExtras,
    days,
    quote,
    isLoading: (state.vehicleSlug !== null && vehicleQuery.isPending) || extrasQuery.isPending,
  };
}
