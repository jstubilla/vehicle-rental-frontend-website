"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingByReference } from "@/api/bookings";

export function useBookingDetails(reference: string) {
  return useQuery({
    queryKey: ["booking", reference],
    queryFn: () => getBookingByReference(reference),
    // Right after sending the request, the submit step has already put the full details here (with
    // the renter's contact details, which a fresh lookup by reference leaves out): don't replace them.
    staleTime: Infinity,
  });
}
