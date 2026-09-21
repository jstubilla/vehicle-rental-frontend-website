import { rentalSearchToParams, type RentalSearch } from "@/lib/rental";

/** Detail page link. Carries the chosen dates along so they are not lost. */
export function vehicleHref(slug: string, rental: RentalSearch | null): string {
  return rental ? `/vehicles/${slug}?${rentalSearchToParams(rental)}` : `/vehicles/${slug}`;
}

/** Start of the booking flow for a specific vehicle (built in Phase 3). */
export function bookHref(slug: string, rental: RentalSearch | null): string {
  const params = rental ? rentalSearchToParams(rental) : new URLSearchParams();
  params.set("vehicle", slug);
  return `/book/dates?${params}`;
}
