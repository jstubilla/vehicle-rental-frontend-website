import { Skeleton } from "@/components/ui";
import type { RentalSearch } from "@/lib/rental";
import type { Vehicle } from "@/types";
import { VehicleCard } from "./vehicle-card";

/** Responsive list of vehicle cards: 1 column on phones, 2 on tablets, 3 on desktop. */
export function VehicleGrid({
  vehicles,
  rental = null,
  days = null,
  columns = 3,
}: {
  vehicles: Vehicle[];
  rental?: RentalSearch | null;
  days?: number | null;
  /** Max columns on large screens. */
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={
        columns === 4
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <VehicleCard vehicle={vehicle} rental={rental} days={days} />
        </li>
      ))}
    </ul>
  );
}

/** Gray placeholder cards shown while vehicles load. */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <Skeleton className="aspect-photo h-auto" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
