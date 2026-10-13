"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError } from "@/api/client";
import { Alert, Button, FormField, Input, Modal, Textarea } from "@/components/ui";
import { content } from "@/content";
import type { Customer } from "@/types";
import { useCustomerMutations } from "../hooks/use-customer-mutations";
import { customerFormSchema, type CustomerFormValues } from "../schemas";

const t = content.admin.customers.form;

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a customer to edit; leave out to add a new one. */
  customer?: Customer;
  /** Called with the saved customer's id after saving (e.g. to open their profile). */
  onSaved?: (customerId: string) => void;
}

export function CustomerFormModal({ open, onOpenChange, customer, onSaved }: CustomerFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={customer ? t.editTitle : t.addTitle} size="md">
      {/* Mounted only while the dialog is open, so it always starts from fresh values. */}
      <CustomerForm customer={customer} onClose={() => onOpenChange(false)} onSaved={onSaved} />
    </Modal>
  );
}

function CustomerForm({
  customer,
  onClose,
  onSaved,
}: {
  customer?: Customer;
  onClose: () => void;
  onSaved?: (customerId: string) => void;
}) {
  const { create, update } = useCustomerMutations();
  const mutation = customer ? update : create;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      licenseNumber: customer?.licenseNumber ?? "",
      notes: customer?.notes ?? "",
    },
  });
  const { register, formState, setError } = form;
  const { errors } = formState;

  const onSubmit = form.handleSubmit((values) => {
    const options = {
      onSuccess: (saved: Customer) => {
        onClose();
        onSaved?.(saved.id);
      },
      onError: (error: Error) => {
        if (error instanceof ApiError && error.code === "duplicate_email") {
          setError("email", { message: t.duplicateEmail });
        }
      },
    };
    if (customer) update.mutate({ id: customer.id, input: values }, options);
    else create.mutate(values, options);
  });

  const duplicateEmail = mutation.error instanceof ApiError && mutation.error.code === "duplicate_email";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mutation.isError && !duplicateEmail && <Alert variant="danger">{content.admin.common.saveError}</Alert>}
      <FormField label={t.name} required error={errors.name?.message}>
        <Input {...register("name")} autoComplete="off" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.email} required error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="off" />
        </FormField>
        <FormField label={t.phone} required hint={t.phoneHint} error={errors.phone?.message}>
          <Input {...register("phone")} type="tel" autoComplete="off" />
        </FormField>
      </div>
      <FormField label={t.license}>
        <Input {...register("licenseNumber")} autoComplete="off" />
      </FormField>
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
