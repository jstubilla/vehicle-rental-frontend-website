"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/api/client";
import type { StaffRow } from "@/api/users";
import { Alert, Button, Checkbox, FormField, Input, Modal, Select } from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import { useRoleOptions, useUserMutations, userErrorMessage } from "../hooks/use-staff";
import { userFormSchema, type UserFormValues } from "../schemas";

const t = content.admin.users.form;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a user to edit; leave out to add a new one. */
  user?: StaffRow;
}

export function UserFormModal({ open, onOpenChange, user }: UserFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={user ? t.editTitle : t.addTitle} size="md">
      {/* Mounted only while the dialog is open, so it always starts from fresh values. */}
      <UserForm user={user} onClose={() => onOpenChange(false)} />
    </Modal>
  );
}

function UserForm({ user, onClose }: { user?: StaffRow; onClose: () => void }) {
  const { session } = useAuth();
  const roles = useRoleOptions();
  const { create, update } = useUserMutations();
  const mutation = user ? update : create;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      roleId: user?.roleId ?? "",
      active: user?.active ?? true,
    },
  });
  const { register, control, setError, formState } = form;
  const { errors } = formState;
  const editingSelf = user !== undefined && user.id === session?.userId;

  const onSubmit = form.handleSubmit((values) => {
    const options = {
      onSuccess: onClose,
      onError: (error: Error) => {
        if (error instanceof ApiError && error.code === "duplicate_email") {
          setError("email", { message: content.admin.users.errors.duplicate_email });
        }
      },
    };
    if (user) update.mutate({ id: user.id, input: values }, options);
    else create.mutate(values, options);
  });

  const emailProblem = mutation.error instanceof ApiError && mutation.error.code === "duplicate_email";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mutation.isError && !emailProblem && <Alert variant="danger">{userErrorMessage(mutation.error)}</Alert>}

      <FormField label={t.name} required error={errors.name?.message}>
        <Input {...register("name")} autoComplete="off" />
      </FormField>
      <FormField label={t.email} required error={errors.email?.message}>
        <Input {...register("email")} type="email" autoComplete="off" />
      </FormField>
      <FormField label={t.role} required hint={user ? content.admin.users.roleChangeNote : undefined} error={errors.roleId?.message}>
        {/* Controlled, because the roles load after the form opens. */}
        <Controller
          control={control}
          name="roleId"
          render={({ field }) => (
            <Select name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
              <option value="">{t.rolePlaceholder}</option>
              {roles.data?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          )}
        />
      </FormField>
      <Checkbox {...register("active")} label={t.active} disabled={editingSelf} />
      {SHOW_MOCK_CONTROLS && <p className="text-sm text-muted">{t.passwordNote}</p>}

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
