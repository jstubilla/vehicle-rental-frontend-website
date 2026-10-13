"use client";

import { useQuery } from "@tanstack/react-query";
import { getVehicleBySlug, listFeaturedVehicles, listVehicles } from "@/api/vehicles";
import type { Vehicle } from "@/types";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  list: () => [...vehicleKeys.all, "list"] as const,
  featured: () => [...vehicleKeys.all, "featured"] as const,
  detail: (slug: string) => [...vehicleKeys.all, "detail", slug] as const,
  search: (filters: unknown) => [...vehicleKeys.all, "search", filters] as const,
};

/**
 * `initialData` is what the server already rendered (good for search engines).
 * `initialDataUpdatedAt: 0` tells the client to fetch fresh data right away, so
 * changes made in the CRM show up without a reload.
 */
export function useFeaturedVehicles(initialData?: Vehicle[]) {
  return useQuery({
    queryKey: vehicleKeys.featured(),
    queryFn: listFeaturedVehicles,
    initialData,
    initialDataUpdatedAt: 0,
  });
}

/** Pass null while no vehicle is chosen yet (the query then stays idle). */
export function useVehicle(slug: string | null, initialData?: Vehicle | null) {
  return useQuery({
    queryKey: vehicleKeys.detail(slug ?? ""),
    queryFn: () => getVehicleBySlug(slug!),
    enabled: slug !== null,
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: 0,
  });
}

export function useVehicleList() {
  return useQuery({ queryKey: vehicleKeys.list(), queryFn: listVehicles });
}
