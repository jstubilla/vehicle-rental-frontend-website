"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomerProfile, listCustomers } from "@/api/customers";
import {
  applyCustomerListParams,
  CUSTOMER_NATURAL_DIRECTION,
  parseCustomerListParams,
} from "@/lib/customer-search";
import { nextSort } from "@/lib/list-params";
import { customerKeys } from "@/features/shared/query-keys";
import { useUrlParams } from "@/features/shared/use-url-params";

/** The customer table: search, sort and page all live in the URL. */
export function useCustomerList() {
  const [params, update] = useUrlParams(parseCustomerListParams, applyCustomerListParams);
  const query = useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
  });

  return {
    params,
    result: query.data,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: (q: string) => update({ q, page: 1 }),
    sortBy: (key: typeof params.sort) => update({ ...nextSort(params, key, CUSTOMER_NATURAL_DIRECTION), page: 1 }),
    setPage: (page: number) => update({ page }),
    clear: () => update({ q: "", page: 1 }),
  };
}

export function useCustomerProfile(id: string) {
  return useQuery({ queryKey: customerKeys.profile(id), queryFn: () => getCustomerProfile(id) });
}
