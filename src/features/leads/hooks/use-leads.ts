"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getLead, listLeads } from "@/api/leads";
import { leadKeys } from "@/features/shared/query-keys";
import { useUrlParams } from "@/features/shared/use-url-params";
import {
  applyLeadListParams,
  countActiveLeadFilters,
  LEAD_NATURAL_DIRECTION,
  parseLeadListParams,
} from "@/lib/lead-search";
import { nextSort } from "@/lib/list-params";

/** The lead table: search, filters, sort and page all live in the URL. */
export function useLeadList() {
  const [params, update] = useUrlParams(parseLeadListParams, applyLeadListParams);
  const query = useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => listLeads(params),
    placeholderData: keepPreviousData,
  });

  return {
    params,
    activeFilterCount: countActiveLeadFilters(params),
    result: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: (q: string) => update({ q, page: 1 }),
    setFilter: (patch: Partial<typeof params>) => update({ ...patch, page: 1 }),
    sortBy: (key: typeof params.sort) => update({ ...nextSort(params, key, LEAD_NATURAL_DIRECTION), page: 1 }),
    setPage: (page: number) => update({ page }),
    clear: () => update({ q: "", stage: undefined, source: undefined, assignee: undefined, page: 1 }),
  };
}

export function useLead(id: string) {
  return useQuery({ queryKey: leadKeys.detail(id), queryFn: () => getLead(id) });
}
