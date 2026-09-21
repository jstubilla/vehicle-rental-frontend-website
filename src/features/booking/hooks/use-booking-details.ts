"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingByReference } from "@/api/bookings";

export function useBookingDetails(reference: string) {
  return useQuery({
    queryKey: ["booking", reference],
    queryFn: () => getBookingByReference(reference),
  });
}
