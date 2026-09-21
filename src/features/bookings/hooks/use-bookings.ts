"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getBookingById, listBookings } from "@/api/booking-admin";
import { bookingKeys } from "@/features/shared/query-keys";
import { useUrlParams } from "@/features/shared/use-url-params";
import {
  applyBookingListParams,
  BOOKING_NATURAL_DIRECTION,
  parseBookingListParams,
} from "@/lib/booking-search";
import { nextSort } from "@/lib/list-params";

/** The booking table: search, status filter, sort and page all live in the URL. */
export function useBookingList() {
  const [params, update] = useUrlParams(parseBookingListParams, applyBookingListParams);
  const query = useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => listBookings(params),
    placeholderData: keepPreviousData,
  });

  return {
    params,
    result: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: (q: string) => update({ q, page: 1 }),
    setStatus: (status: typeof params.status) => update({ status, page: 1 }),
    sortBy: (key: typeof params.sort) => update({ ...nextSort(params, key, BOOKING_NATURAL_DIRECTION), page: 1 }),
    setPage: (page: number) => update({ page }),
    clear: () => update({ q: "", status: undefined, page: 1 }),
  };
}

export function useBooking(id: string) {
  return useQuery({ queryKey: bookingKeys.detail(id), queryFn: () => getBookingById(id) });
}
