import { content } from "@/content";
import { todayISO } from "@/lib/dates";
import { searchTasks, type TaskListParams, type TaskRow as TaskListRow } from "@/lib/task-search";
import type { Paginated, Task } from "@/types";
import { requireStaff } from "./auth";
import { ApiError, check, toApiError, unwrap } from "./client";
import { activitySubject, toTask, type TaskRow } from "./rows";
import { db } from "./supabase";

const WITH_NAMES = "*, assignee:staff(name), lead:leads(name), customer:customers(name)";

type TaskWithNames = TaskRow & {
  assignee: { name: string } | null;
  lead: { name: string } | null;
  customer: { name: string } | null;
};

function toRows(rows: TaskWithNames[]): TaskListRow[] {
  const today = todayISO();
  return rows.map(({ assignee, lead, customer, ...row }) => {
    const task = toTask(row);
    return {
      ...task,
      assigneeName: assignee?.name ?? null,
      linkedName: (task.linkedType === "lead" ? lead?.name : task.linkedType === "customer" ? customer?.name : null) ?? null,
      overdue: task.status === "open" && task.dueDate < today,
    };
  });
}

export async function listTasks(params: TaskListParams): Promise<Paginated<TaskListRow>> {
  const { userId } = await requireStaff();
  const rows = unwrap(await db().from("tasks").select(WITH_NAMES)) as TaskWithNames[];
  return searchTasks(toRows(rows), params, userId);
}

/** The tasks linked to one lead or customer, open ones first (for their detail pages). */
export async function listTasksFor(linkedType: "lead" | "customer", linkedId: string): Promise<TaskListRow[]> {
  await requireStaff();
  const rows = unwrap(
    await db().from("tasks").select(WITH_NAMES).eq(linkedType === "lead" ? "lead_id" : "customer_id", linkedId),
  ) as TaskWithNames[];
  return toRows(rows).sort(
    (a, b) => Number(a.status === "done") - Number(b.status === "done") || a.dueDate.localeCompare(b.dueDate),
  );
}

/** Names for the "linked to" picker in the task form. */
export async function listLinkOptions(type: "lead" | "customer"): Promise<{ id: string; name: string }[]> {
  await requireStaff();
  const rows = unwrap(await db().from(type === "lead" ? "leads" : "customers").select("id, name").order("name")) as {
    id: string;
    name: string;
  }[];
  return rows;
}

export interface TaskInput {
  title: string;
  notes: string;
  dueDate: string;
  assigneeId: string | null;
  linkedType: "lead" | "customer" | null;
  linkedId: string | null;
}

const toColumns = (input: TaskInput) => ({
  title: input.title.trim(),
  notes: input.notes.trim(),
  due_date: input.dueDate,
  assignee_id: input.assigneeId,
  lead_id: input.linkedType === "lead" ? input.linkedId : null,
  customer_id: input.linkedType === "customer" ? input.linkedId : null,
});

export async function createTask(input: TaskInput): Promise<Task> {
  await requireStaff();
  return toTask(unwrap(await db().from("tasks").insert(toColumns(input)).select("*").single()) as TaskRow);
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  await requireStaff();
  const { data, error } = await db().from("tasks").update(toColumns(input)).eq("id", id).select("*").maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("Task not found", 404, "not_found");
  return toTask(data as TaskRow);
}

/** Marks a task done (or open again). Finishing a task is noted on the lead or customer it belongs to. */
export async function setTaskDone(id: string, done: boolean): Promise<Task> {
  const { userId } = await requireStaff();
  const { data, error } = await db()
    .from("tasks")
    .update({ status: done ? "done" : "open" })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("Task not found", 404, "not_found");
  const task = toTask(data as TaskRow);

  if (done && task.linkedType && task.linkedId) {
    check(
      await db()
        .from("activities")
        .insert({
          type: "note",
          body: content.admin.tasks.completedNote(task.title),
          author_id: userId,
          ...activitySubject(task.linkedType, task.linkedId),
        }),
    );
  }
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  await requireStaff();
  check(await db().from("tasks").delete().eq("id", id));
}
