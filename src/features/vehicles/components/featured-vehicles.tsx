"use client";

import { ErrorState } from "@/components/ui";
import type { Vehicle } from "@/types";
import { useFeaturedVehicles } from "../hooks/use-vehicles";
import { VehicleGrid, VehicleGridSkeleton } from "./vehicle-grid";

/** Home page vehicles. Starts with the server's list, then refreshes from the data layer. */
export function FeaturedVehicles({ initialData }: { initialData: Vehicle[] }) {
  const { data, isError, refetch } = useFeaturedVehicles(initialData);

  if (isError && !data) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return <VehicleGridSkeleton count={4} />;
  return <VehicleGrid vehicles={data} columns={4} />;
}
