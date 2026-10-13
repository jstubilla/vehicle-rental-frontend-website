"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Checkbox,
  ConfirmModal,
  EmptyState,
  ErrorState,
  FormField,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { content } from "@/content";
import { SearchBox } from "@/features/shared/search-box";
import { useUsers } from "@/features/users/hooks/use-users";
import { MINE, NOBODY, type TaskListParams, type TaskRow } from "@/lib/task-search";
import { useTaskMutations } from "../hooks/use-task-mutations";
import { useTaskList } from "../hooks/use-tasks";
import { TaskDue } from "./task-due";
import { TaskFormModal } from "./task-form-modal";

const t = content.admin.tasks;

export function TaskList() {
  const list = useTaskList();
  const users = useUsers();
  const { setDone, remove } = useTaskMutations();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const { params, result } = list;

  const sortState = (key: TaskListParams["sort"]) => (params.sort === key ? params.dir : "none");
  const filtered = params.q !== "" || params.assignee !== undefined || params.status !== "open";

  function linkedCell(task: TaskRow) {
    if (!task.linkedType || !task.linkedName) return content.admin.common.none;
    return (
      <Link href={`/admin/${task.linkedType === "lead" ? "leads" : "customers"}/${task.linkedId}`}>
        {task.linkedName}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{t.title}</h1>
          <p className="text-lg text-muted">{t.description}</p>
        </div>
        <Button onClick={() => setAdding(true)}>{t.add}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SearchBox value={params.q} onSearch={list.search} label={t.searchLabel} placeholder={t.searchPlaceholder} />
        <FormField label={t.filters.status} hideLabel>
          <Select
            value={params.status}
            onChange={(e) => list.setFilter({ status: e.target.value as TaskListParams["status"] })}
          >
            {(["open", "done", "all"] as const).map((status) => (
              <option key={status} value={status}>
                {t.filters.status}: {t.statuses[status]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.filters.assignee} hideLabel>
          <Select value={params.assignee ?? ""} onChange={(e) => list.setFilter({ assignee: e.target.value || undefined })}>
            <option value="">
              {t.filters.assignee}: {content.admin.common.any}
            </option>
            <option value={MINE}>{t.filters.mine}</option>
            <option value={NOBODY}>{content.admin.common.unassigned}</option>
            {users.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {list.isError && !result ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : !result ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : result.total === 0 ? (
        filtered ? (
          <EmptyState
            title={content.admin.common.noResultsTitle}
            description={content.admin.common.noResultsDescription}
            action={
              <Button variant="outline" onClick={list.clear}>
                {content.admin.common.clearFilters}
              </Button>
            }
          />
        ) : (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        )
      ) : (
        <>
          <div aria-busy={list.isFetching} className={list.isFetching ? "opacity-60" : undefined}>
            <Table label={t.title} variant="striped">
              <TableHeader>
                <TableRow>
                  <TableHead sortDirection={sortState("status")} onSort={() => list.sortBy("status")}>
                    {t.columns.done}
                  </TableHead>
                  <TableHead sortDirection={sortState("title")} onSort={() => list.sortBy("title")}>
                    {t.columns.title}
                  </TableHead>
                  <TableHead sortDirection={sortState("due")} onSort={() => list.sortBy("due")}>
                    {t.columns.due}
                  </TableHead>
                  <TableHead>{t.columns.assignee}</TableHead>
                  <TableHead>{t.columns.linked}</TableHead>
                  <TableHead>{t.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox
                        hideLabel
                        label={task.status === "done" ? t.markOpen(task.title) : t.markDone(task.title)}
                        checked={task.status === "done"}
                        disabled={setDone.isPending}
                        onChange={(e) => setDone.mutate({ id: task.id, done: e.target.checked })}
                      />
                    </TableCell>
                    <TableCell className={task.status === "done" ? "text-muted line-through" : "font-medium"}>
                      {task.title}
                      {task.notes && <span className="block text-sm font-normal text-muted no-underline">{task.notes}</span>}
                    </TableCell>
                    <TableCell>
                      <TaskDue task={task} />
                    </TableCell>
                    <TableCell>{task.assigneeName ?? content.admin.common.unassigned}</TableCell>
                    <TableCell>{linkedCell(task)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(task)}>
                          {content.admin.common.edit}
                          <span className="sr-only"> {task.title}</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(task)}>
                          {content.admin.common.delete}
                          <span className="sr-only"> {task.title}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p role="status" className="text-sm text-muted">
              {content.admin.common.showingRange(
                (result.page - 1) * result.pageSize + 1,
                Math.min(result.page * result.pageSize, result.total),
                result.total,
              )}
            </p>
            <Pagination page={result.page} pageCount={result.pageCount} onPageChange={list.setPage} />
          </div>
        </>
      )}

      <TaskFormModal open={adding} onOpenChange={setAdding} />
      <TaskFormModal open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} task={editing ?? undefined} />
      <ConfirmModal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.deleteTitle}
        description={deleting?.title ?? t.deleteDescription}
        confirmLabel={content.admin.common.confirmDelete}
        cancelLabel={content.admin.common.cancel}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
