"use client";

import { createContext, useContext } from "react";
import type { Location } from "@/types";

/** Pick-up locations, loaded once on the server by the booking layout and shared by every step. */
export const BookingLocationsContext = createContext<Location[]>([]);

export function useBookingLocations(): Location[] {
  return useContext(BookingLocationsContext);
}

export function locationName(locations: Location[], id: string | undefined): string {
  return locations.find((location) => location.id === id)?.name ?? "";
}
