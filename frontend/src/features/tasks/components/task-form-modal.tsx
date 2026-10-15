"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, Button, DatePicker, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useUsers } from "@/features/users/hooks/use-users";
import { addDaysISO, todayISO } from "@/lib/dates";
import type { Task } from "@/types";
import { useTaskMutations } from "../hooks/use-task-mutations";
import { useLinkOptions } from "../hooks/use-tasks";
import { taskFormSchema, type TaskFormValues } from "../schemas";

const t = content.admin.tasks.form;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a task to edit; leave out to add a new one. */
  task?: Task;
  /** Fixes what the new task is about (used on a lead or customer page). */
  preset?: { type: "lead" | "customer"; id: string };
}

export function TaskFormModal({ open, onOpenChange, task, preset }: TaskFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={task ? t.editTitle : t.addTitle} size="md">
      {/* Mounted only while the dialog is open, so it always starts from fresh values. */}
      <TaskForm task={task} preset={preset} onClose={() => onOpenChange(false)} />
    </Modal>
  );
}

function TaskForm({ task, preset, onClose }: { task?: Task; preset?: TaskFormModalProps["preset"]; onClose: () => void }) {
  const { session } = useAuth();
  const { create, update } = useTaskMutations();
  const mutation = task ? update : create;
  const users = useUsers();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      notes: task?.notes ?? "",
      dueDate: task?.dueDate ?? addDaysISO(todayISO(), 1),
      assigneeId: task ? (task.assigneeId ?? "") : (session?.userId ?? ""),
      linkType: task?.linkedType ?? preset?.type ?? "none",
      linkId: task?.linkedId ?? preset?.id ?? "",
    },
  });
  const { register, control, setValue, formState } = form;
  const { errors } = formState;
  const linkType = useWatch({ control, name: "linkType" });
  const options = useLinkOptions(linkType === "none" ? null : linkType);

  const onSubmit = form.handleSubmit((values) => {
    const input = {
      title: values.title,
      notes: values.notes,
      dueDate: values.dueDate,
      assigneeId: values.assigneeId || null,
      linkedType: values.linkType === "none" ? null : values.linkType,
      linkedId: values.linkType === "none" ? null : values.linkId,
    };
    if (task) update.mutate({ id: task.id, input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  });

  const assignable = users.data?.filter((user) => user.active || user.id === task?.assigneeId) ?? [];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mutation.isError && <Alert variant="danger">{content.admin.common.saveError}</Alert>}

      <FormField label={t.title} required error={errors.title?.message}>
        <Input {...register("title")} autoComplete="off" />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.due} required error={errors.dueDate?.message}>
          <Controller
            control={control}
            name="dueDate"
            render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
          />
        </FormField>
        <FormField label={t.assignee}>
          {/* Controlled, because the staff list loads after the form opens. */}
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <Select name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                <option value="">{content.admin.common.unassigned}</option>
                {assignable.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormField>
      </div>

      {!preset && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t.linkType}>
            <Controller
              control={control}
              name="linkType"
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setValue("linkId", "");
                  }}
                >
                  <option value="none">{t.linkNone}</option>
                  <option value="lead">{t.linkLead}</option>
                  <option value="customer">{t.linkCustomer}</option>
                </Select>
              )}
            />
          </FormField>
          {linkType !== "none" && (
            <FormField label={t.linkTarget} required error={errors.linkId?.message}>
              <Controller
                control={control}
                name="linkId"
                render={({ field }) => (
                  <Select name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                    <option value="">{t.choose}</option>
                    {options.data?.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>
          )}
        </div>
      )}

      <FormField label={t.notes}>
        <Textarea {...register("notes")} />
      </FormField>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          {content.admin.common.cancel}
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {mutation.isPending ? content.admin.common.saving : content.admin.common.save}
        </Button>
      </div>
    </form>
  );
}
