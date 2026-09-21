"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useTaskMutations } from "../hooks/use-task-mutations";
import { useLinkedTasks } from "../hooks/use-tasks";
import { TaskDue } from "./task-due";
import { TaskFormModal } from "./task-form-modal";

const t = content.admin.tasks;

/** The follow-ups for one lead or customer, with a quick way to add another. Hidden for roles without task access. */
export function LinkedTasksCard({ type, id }: { type: "lead" | "customer"; id: string }) {
  const { can } = useAuth();
  const tasks = useLinkedTasks(type, id);
  const { setDone } = useTaskMutations();
  const [adding, setAdding] = useState(false);

  if (!can("tasks.manage")) return null;

  return (
    <Card as="section" aria-labelledby={`linked-tasks-${id}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle as="h2" id={`linked-tasks-${id}`} className="text-xl">
              {t.linkedCard.title}
            </CardTitle>
            <CardDescription>{t.linkedCard.description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            {t.linkedCard.add}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tasks.isError ? (
          <ErrorState onRetry={() => tasks.refetch()} />
        ) : tasks.isPending ? (
          <Skeleton className="h-12" />
        ) : tasks.data.length === 0 ? (
          <p className="text-muted">{t.linkedCard.empty}</p>
        ) : (
          <ul>
            {tasks.data.map((task) => (
              <li key={task.id} className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
                <Checkbox
                  hideLabel
                  label={task.status === "done" ? t.markOpen(task.title) : t.markDone(task.title)}
                  checked={task.status === "done"}
                  disabled={setDone.isPending}
                  onChange={(e) => setDone.mutate({ id: task.id, done: e.target.checked })}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className={task.status === "done" ? "text-muted line-through" : "font-medium"}>{task.title}</span>
                  <span className="text-sm text-muted">
                    <TaskDue task={task} />
                    {" · "}
                    {task.assigneeName ?? content.admin.common.unassigned}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="link" size="sm" className="self-start">
          <Link href="/admin/tasks">{t.linkedCard.viewAll}</Link>
        </Button>
      </CardContent>

      <TaskFormModal open={adding} onOpenChange={setAdding} preset={{ type, id }} />
    </Card>
  );
}
