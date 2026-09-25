"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmModal,
  EmptyState,
  ErrorState,
  FormField,
  Select,
  Skeleton,
} from "@/components/ui";
import { content } from "@/content";
import { ActivityLog } from "@/features/activities/components/activity-log";
import { ContactDetailsCard } from "@/features/contacts/components/contact-details-card";
import { LinkedTasksCard } from "@/features/tasks/components/linked-tasks-card";
import { LEAD_STAGES, type LeadStage } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { useLeadMutations } from "../hooks/use-lead-mutations";
import { useLead } from "../hooks/use-leads";
import { LeadStageBadge } from "../stage-style";
import { LeadFormModal } from "./lead-form-modal";

const t = content.admin.leads;

export function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const query = useLead(id);
  const { changeStage, convert, remove } = useLeadMutations();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingConvert, setConfirmingConvert] = useState(false);

  if (query.isError) return <ErrorState headingAs="h1" onRetry={() => query.refetch()} />;
  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (!query.data) {
    return (
      <EmptyState
        headingAs="h1"
        title={content.admin.common.notFoundTitle}
        description={content.admin.common.notFoundDescription}
        action={
          <Button asChild>
            <Link href="/admin/leads">{t.detail.back}</Link>
          </Button>
        }
      />
    );
  }

  const { lead, vehicle, assigneeName, customer } = query.data;
  const canConvert = !lead.customerId;

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="link" className="self-start">
        <Link href="/admin/leads">← {t.detail.back}</Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{lead.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-muted">
            <LeadStageBadge stage={lead.stage} />
            {t.detail.created} {formatDate(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canConvert && (
            <Button onClick={() => setConfirmingConvert(true)}>{t.detail.convert}</Button>
          )}
          <Button variant="outline" onClick={() => setEditing(true)}>
            {content.admin.common.edit}
          </Button>
          <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
            {content.admin.common.delete}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card as="section" aria-labelledby="lead-details-heading">
            <CardHeader>
              <CardTitle as="h2" id="lead-details-heading" className="text-xl">
                {t.detail.details}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">{t.form.phone}</dt>
                  <dd className="font-medium">
                    <a href={`tel:${lead.phone.replace(/[\s()-]/g, "")}`}>{lead.phone}</a>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-muted">{t.form.email}</dt>
                  <dd className="font-medium wrap-anywhere">
                    <a href={`mailto:${lead.email}`}>{lead.email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.detail.source}</dt>
                  <dd className="font-medium">{content.enums.leadSource[lead.source]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.detail.assignee}</dt>
                  <dd className="font-medium">{assigneeName ?? content.admin.common.unassigned}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.detail.vehicle}</dt>
                  <dd className="font-medium">
                    {vehicle ? <Link href={`/vehicles/${vehicle.slug}`}>{vehicle.name}</Link> : content.admin.common.none}
                  </dd>
                </div>
                {customer && (
                  <div>
                    <dt className="text-sm text-muted">{t.detail.customerLinked}</dt>
                    <dd className="font-medium">
                      <Link href={`/admin/customers/${customer.id}`}>{customer.name}</Link>
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted">{t.detail.message}</dt>
                  <dd className="whitespace-pre-wrap">{lead.message || t.detail.noMessage}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <ContactDetailsCard owner="lead" ownerId={lead.id} contacts={lead.additionalContacts} />

          <LinkedTasksCard type="lead" id={lead.id} />

          <ActivityLog entityType="lead" entityId={lead.id} />
        </div>

        <aside aria-label={t.detail.stage} className="min-w-0 lg:col-span-1">
          <Card as="section" aria-labelledby="stage-heading" className="lg:sticky lg:top-8">
            <CardHeader>
              <CardTitle as="h2" id="stage-heading" className="text-xl">
                {t.detail.stage}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <FormField label={t.detail.changeStage}>
                <Select
                  value={lead.stage}
                  disabled={changeStage.isPending}
                  onChange={(e) => changeStage.mutate({ id: lead.id, stage: e.target.value as LeadStage })}
                >
                  {LEAD_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {content.enums.leadStage[stage]}
                    </option>
                  ))}
                </Select>
              </FormField>
              {canConvert && <p className="text-sm text-muted">{t.detail.convertHint}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>

      <LeadFormModal open={editing} onOpenChange={setEditing} lead={lead} />
      <ConfirmModal
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.deleteTitle}
        description={t.deleteDescription}
        confirmLabel={content.admin.common.confirmDelete}
        cancelLabel={content.admin.common.cancel}
        loading={remove.isPending}
        onConfirm={() => remove.mutate(lead.id, { onSuccess: () => router.replace("/admin/leads") })}
      />
      <ConfirmModal
        open={confirmingConvert}
        onOpenChange={setConfirmingConvert}
        title={t.detail.convertTitle}
        description={t.detail.convertDescription}
        confirmLabel={t.detail.convert}
        cancelLabel={content.admin.common.cancel}
        variant="default"
        loading={convert.isPending}
        onConfirm={() => convert.mutate(lead.id, { onSuccess: () => setConfirmingConvert(false) })}
      />
    </div>
  );
}
