import Link from "next/link";
import { Badge, type BadgeVariant } from "@/components/ui";
import type { ActivityView } from "@/api/activities";
import { content } from "@/content";
import { formatDateTime, formatRelativeTime } from "@/lib/dates";

const t = content.admin.activities;

const TYPE_VARIANT: Record<ActivityView["type"], BadgeVariant> = {
  note: "neutral",
  call: "info",
  status_change: "outline",
};

/** One row in an activity log or feed. Pass `showEntity` to also name the lead or customer it is about. */
export function ActivityItem({ activity, showEntity = false }: { activity: ActivityView; showEntity?: boolean }) {
  const entityHref = `/admin/${activity.entityType === "lead" ? "leads" : "customers"}/${activity.entityId}`;

  return (
    <li className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={TYPE_VARIANT[activity.type]}>{content.enums.activityType[activity.type]}</Badge>
        {showEntity && activity.entityName && (
          <span className="text-sm">
            <span className="text-muted">{t.related[activity.entityType]}: </span>
            <Link href={entityHref} className="font-medium">
              {activity.entityName}
            </Link>
          </span>
        )}
      </div>
      <p>{activity.body}</p>
      <p className="text-sm text-muted">
        <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
          {formatRelativeTime(activity.createdAt)}
        </time>
        {" · "}
        {activity.authorName ? `${t.by} ${activity.authorName}` : t.system}
      </p>
    </li>
  );
}
