"use client";

import { ErrorState, Reveal, Skeleton } from "@/components/ui";
import type { Vehicle } from "@/types";
import { useFeaturedVehicles } from "../hooks/use-vehicles";
import { VehicleCard } from "./vehicle-card";

/**
 * Home page vehicles: the first as a large lead card, the rest as a compact list beside it.
 * Starts with the server's list, then refreshes from the data layer.
 */
export function FeaturedVehicles({ initialData }: { initialData: Vehicle[] }) {
  const { data, isError, refetch } = useFeaturedVehicles(initialData);

  if (isError && !data) return <ErrorState onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="grid gap-3 md:gap-4 lg:grid-cols-12" aria-hidden="true">
        <Skeleton className="h-96 lg:col-span-7" />
        <Skeleton className="h-96 lg:col-span-5" />
      </div>
    );
  }

  const [lead, ...rest] = data;
  if (!lead) return null;

  return (
    <Reveal className="grid gap-3 md:gap-4 lg:grid-cols-12">
      <div data-reveal-item="" className="lg:col-span-7">
        <VehicleCard vehicle={lead} layout="feature" />
      </div>
      {rest.length > 0 && (
        <ul data-reveal-item="" className="flex flex-col gap-3 md:gap-4 lg:col-span-5">
          {rest.map((vehicle) => (
            <li key={vehicle.id} className="flex-1">
              <VehicleCard vehicle={vehicle} layout="row" />
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
}
