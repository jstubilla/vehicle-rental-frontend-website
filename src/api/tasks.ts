import { content } from "@/content";
import { todayISO } from "@/lib/dates";
import { searchTasks, type TaskListParams, type TaskRow } from "@/lib/task-search";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Paginated, Task } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

function toRows(tasks: Task[]): TaskRow[] {
  const users = readTable("users");
  const leads = readTable("leads");
  const customers = readTable("customers");
  const today = todayISO();

  return tasks.map((task) => ({
    ...task,
    assigneeName: users.find((u) => u.id === task.assigneeId)?.name ?? null,
    linkedName:
      task.linkedType === "lead"
        ? (leads.find((l) => l.id === task.linkedId)?.name ?? null)
        : task.linkedType === "customer"
          ? (customers.find((c) => c.id === task.linkedId)?.name ?? null)
          : null,
    overdue: task.status === "open" && task.dueDate < today,
  }));
}

export async function listTasks(params: TaskListParams): Promise<Paginated<TaskRow>> {
  const session = assertCan("tasks.manage");
  await simulateNetwork();
  return searchTasks(toRows(readTable("tasks")), params, session.userId);
}

/** The tasks linked to one lead or customer, open ones first (for their detail pages). */
export async function listTasksFor(linkedType: "lead" | "customer", linkedId: string): Promise<TaskRow[]> {
  assertCan("tasks.manage");
  await simulateNetwork();
  return toRows(readTable("tasks").filter((t) => t.linkedType === linkedType && t.linkedId === linkedId)).sort(
    (a, b) => Number(a.status === "done") - Number(b.status === "done") || a.dueDate.localeCompare(b.dueDate),
  );
}

/** Names for the "linked to" picker in the task form. */
export async function listLinkOptions(type: "lead" | "customer"): Promise<{ id: string; name: string }[]> {
  assertCan("tasks.manage");
  await simulateNetwork();
  const rows = type === "lead" ? readTable("leads") : readTable("customers");
  return rows.map((row) => ({ id: row.id, name: row.name })).sort((a, b) => a.name.localeCompare(b.name));
}

export interface TaskInput {
  title: string;
  notes: string;
  dueDate: string;
  assigneeId: string | null;
  linkedType: "lead" | "customer" | null;
  linkedId: string | null;
}

export async function createTask(input: TaskInput): Promise<Task> {
  assertCan("tasks.manage");
  await simulateNetwork();

  const task: Task = {
    id: newId("task"),
    ...input,
    title: input.title.trim(),
    notes: input.notes.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  writeTable("tasks", [task, ...readTable("tasks")]);
  return task;
}

export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  assertCan("tasks.manage");
  await simulateNetwork();

  const tasks = readTable("tasks");
  const existing = tasks.find((t) => t.id === id);
  if (!existing) throw new ApiError("Task not found", 404, "not_found");

  const updated: Task = { ...existing, ...input, title: input.title.trim(), notes: input.notes.trim() };
  writeTable("tasks", tasks.map((t) => (t.id === id ? updated : t)));
  return updated;
}

/** Marks a task done (or open again). Finishing a task is noted on the lead or customer it belongs to. */
export async function setTaskDone(id: string, done: boolean): Promise<Task> {
  const session = assertCan("tasks.manage");
  await simulateNetwork();

  const tasks = readTable("tasks");
  const existing = tasks.find((t) => t.id === id);
  if (!existing) throw new ApiError("Task not found", 404, "not_found");

  const now = new Date().toISOString();
  const updated: Task = { ...existing, status: done ? "done" : "open", completedAt: done ? now : null };
  writeTable("tasks", tasks.map((t) => (t.id === id ? updated : t)));

  if (done && existing.linkedType && existing.linkedId) {
    writeTable("activities", [
      {
        id: newId("act"),
        type: "note",
        body: content.admin.tasks.completedNote(existing.title),
        entityType: existing.linkedType,
        entityId: existing.linkedId,
        authorId: session.userId,
        createdAt: now,
      },
      ...readTable("activities"),
    ]);
  }
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  assertCan("tasks.manage");
  await simulateNetwork();
  writeTable("tasks", readTable("tasks").filter((t) => t.id !== id));
}
