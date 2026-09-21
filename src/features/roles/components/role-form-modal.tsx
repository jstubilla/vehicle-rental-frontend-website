"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/api/client";
import type { RoleRow } from "@/api/roles";
import { Alert, Button, FormField, Input, Modal, Textarea } from "@/components/ui";
import { content } from "@/content";
import { roleErrorMessage, useRoleMutations } from "../hooks/use-roles";
import { roleFormSchema, type RoleFormValues } from "../schemas";
import { PermissionMatrix } from "./permission-matrix";

const t = content.admin.roles.form;

interface RoleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a role to edit; leave out to add a new one. */
  role?: RoleRow;
}

export function RoleFormModal({ open, onOpenChange, role }: RoleFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={role ? t.editTitle : t.addTitle} size="lg">
      {/* Mounted only while the dialog is open, so it always starts from fresh values. */}
      <RoleForm role={role} onClose={() => onOpenChange(false)} />
    </Modal>
  );
}

function RoleForm({ role, onClose }: { role?: RoleRow; onClose: () => void }) {
  const { create, update } = useRoleMutations();
  const mutation = role ? update : create;
  const locked = role?.system === true;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissions: role?.permissions ?? [],
    },
  });
  const { register, control, setError, formState } = form;
  const { errors } = formState;

  const onSubmit = form.handleSubmit((values) => {
    const options = {
      onSuccess: onClose,
      onError: (error: Error) => {
        if (error instanceof ApiError && error.code === "duplicate_name") {
          setError("name", { message: content.admin.roles.errors.duplicate_name });
        }
      },
    };
    if (role) update.mutate({ id: role.id, input: values }, options);
    else create.mutate(values, options);
  });

  const nameProblem = mutation.error instanceof ApiError && mutation.error.code === "duplicate_name";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {locked && <Alert variant="info">{t.lockedNote}</Alert>}
      {mutation.isError && !nameProblem && <Alert variant="danger">{roleErrorMessage(mutation.error)}</Alert>}

      <FormField label={t.name} required error={errors.name?.message}>
        <Input {...register("name")} autoComplete="off" disabled={locked} />
      </FormField>
      <FormField label={t.description}>
        <Textarea {...register("description")} rows={2} disabled={locked} />
      </FormField>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t.permissions}</p>
        <p className="text-sm text-muted">{t.editNeedsView}</p>
        <Controller
          control={control}
          name="permissions"
          render={({ field }) => <PermissionMatrix value={field.value} onChange={field.onChange} disabled={locked} />}
        />
        {errors.permissions && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.permissions.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          {locked ? content.ui.close : content.admin.common.cancel}
        </Button>
        {!locked && (
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? content.admin.common.saving : content.admin.common.save}
          </Button>
        )}
      </div>
    </form>
  );
}
