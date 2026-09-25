"use client";

import { useState } from "react";
import { Alert, Button, EmptyState, ErrorState, FormField, Select, Skeleton, Textarea } from "@/components/ui";
import { content } from "@/content";
import type { ActivityType } from "@/lib/constants";
import type { Activity } from "@/types";
import { useActivities, useCreateActivity } from "../hooks/use-activities";
import { ActivityItem } from "./activity-item";

const t = content.admin.activities;

/** Only notes and calls are written by hand; status changes are logged automatically. */
const MANUAL_TYPES: ActivityType[] = ["note", "call"];

/** The log of everything that happened with one lead or customer, plus a form to add to it. */
export function ActivityLog({ entityType, entityId }: { entityType: Activity["entityType"]; entityId: string }) {
  const activities = useActivities(entityType, entityId);
  const create = useCreateActivity();
  const [type, setType] = useState<ActivityType>("note");
  const [body, setBody] = useState("");
  const [showRequired, setShowRequired] = useState(false);

  function submit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!body.trim()) {
      setShowRequired(true);
      return;
    }
    create.mutate(
      { entityType, entityId, type, body },
      {
        onSuccess: () => {
          setBody("");
          setShowRequired(false);
        },
      },
    );
  }

  return (
    <section aria-labelledby={`activity-heading-${entityId}`} className="flex flex-col gap-4">
      <h2 id={`activity-heading-${entityId}`}>{t.title}</h2>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-lg border border-border p-4">
        {create.isError && <Alert variant="danger">{content.admin.common.saveError}</Alert>}
        <div className="grid gap-3 sm:grid-cols-4">
          <FormField label={t.type}>
            <Select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {MANUAL_TYPES.map((option) => (
                <option key={option} value={option}>
                  {content.enums.activityType[option]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label={t.body}
            error={showRequired ? t.errorRequired : undefined}
            className="sm:col-span-3"
          >
            <Textarea
              rows={2}
              value={body}
              placeholder={t.bodyPlaceholder}
              onChange={(e) => setBody(e.target.value)}
            />
          </FormField>
        </div>
        <Button type="submit" loading={create.isPending} className="self-start">
          {create.isPending ? t.submitting : t.submit}
        </Button>
      </form>

      {activities.isError ? (
        <ErrorState onRetry={() => activities.refetch()} />
      ) : activities.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : activities.data.length === 0 ? (
        <EmptyState title={t.empty} description="" />
      ) : (
        <ul>
          {activities.data.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      )}
    </section>
  );
}
