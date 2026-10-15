import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { TaskList } from "@/features/tasks/components/task-list";

export const metadata: Metadata = { title: content.admin.tasks.title };

export default function TasksPage() {
  // The list keeps its search, filters and page in the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <TaskList />
    </Suspense>
  );
}
