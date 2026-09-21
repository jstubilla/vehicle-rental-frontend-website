"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/ui";
import { content } from "@/content";
import { useUsers } from "@/features/users/hooks/use-users";
import { useVehicleList } from "@/features/vehicles/hooks/use-vehicles";
import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import type { Lead } from "@/types";
import { useLeadMutations } from "../hooks/use-lead-mutations";
import { leadFormSchema, type LeadFormValues } from "../schemas";

const t = content.admin.leads.form;

interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a lead to edit; leave out to add a new one. */
  lead?: Lead;
  onSaved?: (leadId: string) => void;
}

export function LeadFormModal({ open, onOpenChange, lead, onSaved }: LeadFormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={lead ? t.editTitle : t.addTitle} size="md">
      {/* Mounted only while the dialog is open, so it always starts from fresh values. */}
      <LeadForm lead={lead} onClose={() => onOpenChange(false)} onSaved={onSaved} />
    </Modal>
  );
}

function LeadForm({ lead, onClose, onSaved }: { lead?: Lead; onClose: () => void; onSaved?: (id: string) => void }) {
  const { create, update } = useLeadMutations();
  const mutation = lead ? update : create;
  const vehicles = useVehicleList();
  const users = useUsers();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      source: lead?.source ?? "phone",
      stage: lead?.stage ?? "new",
      vehicleInterest: lead?.vehicleInterest ?? "",
      assigneeId: lead?.assigneeId ?? "",
      message: lead?.message ?? "",
    },
  });
  const { register, control, formState } = form;
  const { errors } = formState;

  const onSubmit = form.handleSubmit((values) => {
    const input = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      source: values.source,
      vehicleInterest: values.vehicleInterest || null,
      assigneeId: values.assigneeId || null,
      message: values.message,
    };
    const done = (saved: Lead) => {
      onClose();
      onSaved?.(saved.id);
    };
    if (lead) update.mutate({ id: lead.id, input }, { onSuccess: done });
    else create.mutate({ ...input, stage: values.stage }, { onSuccess: done });
  });

  // Inactive staff cannot be assigned new leads, but an existing assignee stays visible.
  const assignable = users.data?.filter((user) => user.active || user.id === lead?.assigneeId) ?? [];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mutation.isError && <Alert variant="danger">{content.admin.common.saveError}</Alert>}
      <FormField label={t.name} required error={errors.name?.message}>
        <Input {...register("name")} autoComplete="off" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.email} required error={errors.email?.message}>
          <Input {...register("email")} type="email" autoComplete="off" />
        </FormField>
        <FormField label={t.phone} required error={errors.phone?.message}>
          <Input {...register("phone")} type="tel" autoComplete="off" />
        </FormField>
      </div>
      <div className={lead ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
        <FormField label={t.source}>
          <Select {...register("source")}>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {content.enums.leadSource[source]}
              </option>
            ))}
          </Select>
        </FormField>
        {/* An existing lead changes stage from its own page, so the change is logged. */}
        {!lead && (
          <FormField label={t.stage}>
            <Select {...register("stage")}>
              {LEAD_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {content.enums.leadStage[stage]}
                </option>
              ))}
            </Select>
          </FormField>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* These two are controlled because their options load after the form opens. */}
        <FormField label={t.vehicle}>
          <Controller
            control={control}
            name="vehicleInterest"
            render={({ field }) => (
              <Select name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} ref={field.ref}>
                <option value="">{t.noVehicle}</option>
                {vehicles.data?.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormField>
        <FormField label={t.assignee}>
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
      <FormField label={t.message}>
        <Textarea {...register("message")} />
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
