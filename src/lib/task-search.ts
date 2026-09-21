import { z } from "zod";
import type { Paginated, Task } from "@/types";
import { matchesSearch, paginate, readParam, type SortDirection } from "./list-params";

export const TASK_SORTS = ["due", "title", "status"] as const;

/** Value of the "assigned to" filter that means "tasks assigned to whoever is signed in". */
export const MINE = "me";
export const NOBODY = "unassigned";

/** Task list settings, kept in the URL (?status=all&assignee=me&sort=due). Open tasks show by default. */
export const taskListSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(["open", "done", "all"]).catch("open"),
  /** MINE, NOBODY or a user id. */
  assignee: z.string().optional().catch(undefined),
  sort: z.enum(TASK_SORTS).catch("due"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type TaskListParams = z.infer<typeof taskListSchema>;

export const TASK_NATURAL_DIRECTION: Record<(typeof TASK_SORTS)[number], SortDirection> = {
  due: "asc",
  title: "asc",
  status: "asc",
};

const KEYS = ["q", "status", "assignee", "sort", "dir", "page"] as const;

export function parseTaskListParams(params: URLSearchParams): TaskListParams {
  return taskListSchema.parse(Object.fromEntries(KEYS.map((key) => [key, readParam(params, key)])));
}

export function applyTaskListParams(base: URLSearchParams, value: TaskListParams): URLSearchParams {
  const next = new URLSearchParams(base);
  KEYS.forEach((key) => next.delete(key));
  if (value.q) next.set("q", value.q);
  if (value.status !== "open") next.set("status", value.status);
  if (value.assignee) next.set("assignee", value.assignee);
  if (value.sort !== "due" || value.dir !== "asc") {
    next.set("sort", value.sort);
    next.set("dir", value.dir);
  }
  if (value.page > 1) next.set("page", String(value.page));
  return next;
}

export type TaskRow = Task & {
  assigneeName: string | null;
  /** Name of the linked lead or customer. */
  linkedName: string | null;
  /** Still open and past its due date. */
  overdue: boolean;
};

/** Search, filter, sort and paginate tasks. `currentUserId` resolves the "assigned to me" filter. */
export function searchTasks(rows: TaskRow[], params: TaskListParams, currentUserId: string): Paginated<TaskRow> {
  const factor = params.dir === "asc" ? 1 : -1;
  const compare: Record<TaskListParams["sort"], (a: TaskRow, b: TaskRow) => number> = {
    due: (a, b) => a.dueDate.localeCompare(b.dueDate),
    title: (a, b) => a.title.localeCompare(b.title),
    status: (a, b) => Number(a.status === "done") - Number(b.status === "done"),
  };

  const matches = rows
    .filter((row) => params.status === "all" || row.status === params.status)
    .filter((row) => {
      if (!params.assignee) return true;
      if (params.assignee === NOBODY) return row.assigneeId === null;
      return row.assigneeId === (params.assignee === MINE ? currentUserId : params.assignee);
    })
    .filter((row) => matchesSearch([row.title, row.linkedName ?? "", row.assigneeName ?? ""], params.q))
    .sort((a, b) => factor * compare[params.sort](a, b) || a.dueDate.localeCompare(b.dueDate));

  return paginate(matches, params.page);
}
