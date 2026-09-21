"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getReport } from "@/api/reports";
import { useUrlParams } from "@/features/shared/use-url-params";
import { applyRange, isValidRange, parseRange, type ReportRange } from "@/lib/reports";

/** The report for the date range in the URL. The range is not queried while it is invalid. */
export function useReport() {
  const [range, update] = useUrlParams(parseRange, applyRange);
  const valid = isValidRange(range);

  const query = useQuery({
    queryKey: ["reports", range],
    queryFn: () => getReport(range),
    enabled: valid,
    placeholderData: keepPreviousData,
  });

  return {
    range,
    valid,
    report: valid ? query.data : undefined,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    setRange: (next: Partial<ReportRange>) => update(next),
  };
}
