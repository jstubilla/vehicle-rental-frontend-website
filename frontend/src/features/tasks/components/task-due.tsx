import { Badge } from "@/components/ui";
import { content } from "@/content";
import { formatDate, todayISO } from "@/lib/dates";
import type { TaskRow } from "@/lib/task-search";

/** A task's due date, with a badge when an open task is overdue or due today. */
export function TaskDue({ task }: { task: Pick<TaskRow, "dueDate" | "status" | "overdue"> }) {
  const t = content.admin.tasks;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="whitespace-nowrap">{formatDate(`${task.dueDate}T00:00:00+08:00`)}</span>
      {task.overdue && <Badge variant="danger">{t.overdue}</Badge>}
      {task.status === "open" && task.dueDate === todayISO() && <Badge variant="warning">{t.dueToday}</Badge>}
    </span>
  );
}
