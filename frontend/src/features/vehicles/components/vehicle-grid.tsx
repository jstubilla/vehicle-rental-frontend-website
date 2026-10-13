import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { RentalSearch } from "@/lib/rental";
import type { Vehicle } from "@/types";
import { VehicleCard } from "./vehicle-card";

/** Responsive list of vehicle cards: 1 column on phones, 2 on tablets, 3 on desktop. */
export function VehicleGrid({
  vehicles,
  rental = null,
  days = null,
  animate = false,
}: {
  vehicles: Vehicle[];
  rental?: RentalSearch | null;
  days?: number | null;
  /** Fade the cards in, one after another (used when the filters change, not on first load). */
  animate?: boolean;
}) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3", animate && "results-stagger")}>
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <VehicleCard vehicle={vehicle} rental={rental} days={days} />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder cards shown while vehicles load. */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <Skeleton className="aspect-video h-auto" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
