"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listLinkOptions, listTasks, listTasksFor } from "@/api/tasks";
import { useUrlParams } from "@/features/shared/use-url-params";
import { taskKeys } from "@/features/shared/query-keys";
import { nextSort } from "@/lib/list-params";
import { applyTaskListParams, parseTaskListParams, TASK_NATURAL_DIRECTION } from "@/lib/task-search";

/** The task table: search, filters, sort and page all live in the URL. */
export function useTaskList() {
  const [params, update] = useUrlParams(parseTaskListParams, applyTaskListParams);
  const query = useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => listTasks(params),
    placeholderData: keepPreviousData,
  });

  return {
    params,
    result: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    search: (q: string) => update({ q, page: 1 }),
    setFilter: (patch: Partial<typeof params>) => update({ ...patch, page: 1 }),
    sortBy: (key: typeof params.sort) => update({ ...nextSort(params, key, TASK_NATURAL_DIRECTION), page: 1 }),
    setPage: (page: number) => update({ page }),
    clear: () => update({ q: "", status: "open", assignee: undefined, page: 1 }),
  };
}

/** Tasks linked to one lead or customer. */
export function useLinkedTasks(type: "lead" | "customer", id: string) {
  return useQuery({ queryKey: taskKeys.linked(type, id), queryFn: () => listTasksFor(type, id) });
}

/** Names for the "which lead / customer?" picker. Idle until a type is chosen. */
export function useLinkOptions(type: "lead" | "customer" | null) {
  return useQuery({
    queryKey: taskKeys.options(type ?? "none"),
    queryFn: () => listLinkOptions(type!),
    enabled: type !== null,
  });
}
