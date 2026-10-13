"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchVehicles } from "@/api/vehicles";
import { countRentalDays, parseRentalSearch } from "@/lib/rental";
import {
  applyFiltersToParams,
  countActiveFilters,
  parseVehicleFilters,
  type VehicleFilters,
} from "@/lib/vehicle-filters";
import type { Paginated, Vehicle } from "@/types";
import { vehicleKeys } from "./use-vehicles";

export interface InitialVehicleSearch {
  filters: VehicleFilters;
  result: Paginated<Vehicle>;
}

/**
 * The catalog's brain. The URL is the single source of truth: filters, sort and
 * page live in the query string, so any search can be shared as a link.
 */
export function useVehicleSearch(initial?: InitialVehicleSearch) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseVehicleFilters(searchParams), [searchParams]);
  const rental = useMemo(() => parseRentalSearch(searchParams), [searchParams]);
  const days = rental ? countRentalDays(rental) : null;

  // Only reuse the server's result while the URL still matches what the server rendered.
  const canUseInitial = initial && JSON.stringify(initial.filters) === JSON.stringify(filters);

  const query = useQuery({
    queryKey: vehicleKeys.search(filters),
    queryFn: () => searchVehicles(filters),
    initialData: canUseInitial ? initial.result : undefined,
    initialDataUpdatedAt: 0,
    placeholderData: keepPreviousData,
  });

  const navigate = useCallback(
    (next: VehicleFilters) => {
      const params = applyFiltersToParams(new URLSearchParams(searchParams.toString()), next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** Change one or more filters. Any change except paging goes back to page 1. */
  const setFilters = useCallback(
    (patch: Partial<VehicleFilters>) => {
      navigate({ ...filters, ...patch, page: patch.page ?? 1 });
    },
    [filters, navigate],
  );

  const reset = useCallback(() => navigate(parseVehicleFilters(new URLSearchParams())), [navigate]);

  return {
    filters,
    rental,
    days,
    setFilters,
    reset,
    activeFilterCount: countActiveFilters(filters),
    result: query.data,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
