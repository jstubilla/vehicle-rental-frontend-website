"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, setTaskDone, updateTask, type TaskInput } from "@/api/tasks";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { activityKeys } from "@/features/activities/hooks/use-activities";
import { taskKeys } from "@/features/shared/query-keys";

const t = content.admin.tasks;

/** Create, edit, finish and delete tasks. Each shows a notification and refreshes every list. */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    create: useMutation({
      mutationFn: (input: TaskInput) => createTask(input),
      onSuccess: () => {
        refresh();
        toast({ title: t.added, variant: "success" });
      },
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: TaskInput }) => updateTask(id, input),
      onSuccess: () => {
        refresh();
        toast({ title: t.saved, variant: "success" });
      },
    }),
    setDone: useMutation({
      mutationFn: ({ id, done }: { id: string; done: boolean }) => setTaskDone(id, done),
      onSuccess: (_task, { done }) => {
        refresh();
        toast({ title: done ? t.doneToast : t.reopenedToast, variant: "success" });
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteTask(id),
      onSuccess: () => {
        refresh();
        toast({ title: t.deleted, variant: "success" });
      },
    }),
  };
}
