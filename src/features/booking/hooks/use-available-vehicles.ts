"use client";

import { useQuery } from "@tanstack/react-query";
import { listVehiclesWithAvailability } from "@/api/bookings";
import type { DateRange } from "@/lib/availability";

export const availabilityKey = ["availability"] as const;

/** Every vehicle, flagged with whether it is free for the chosen dates. */
export function useAvailableVehicles(range: DateRange | null) {
  return useQuery({
    queryKey: [...availabilityKey, range],
    queryFn: () => listVehiclesWithAvailability(range!),
    enabled: range !== null,
  });
}
