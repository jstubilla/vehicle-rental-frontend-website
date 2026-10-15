import type { ActivityType } from "@/lib/constants";
import type { Activity } from "@/types";
import { requireStaff } from "./auth";
import { unwrap } from "./client";
import { activitySubject, toActivity, type ActivityRow } from "./rows";
import { db } from "./supabase";

/** An activity plus the names needed to display it. */
export interface ActivityView extends Activity {
  authorName: string | null;
  /** Name of the lead or customer it belongs to. */
  entityName: string | null;
}

const WITH_NAMES = "*, author:staff(name), lead:leads(name), customer:customers(name)";

type ActivityWithNames = ActivityRow & {
  author: { name: string } | null;
  lead: { name: string } | null;
  customer: { name: string } | null;
};

const toView = ({ author, lead, customer, ...row }: ActivityWithNames): ActivityView => ({
  ...toActivity(row),
  authorName: author?.name ?? null,
  entityName: (row.lead_id ? lead?.name : customer?.name) ?? null,
});

/** The activity log of one lead or customer, newest first. */
export async function listActivities(entityType: Activity["entityType"], entityId: string): Promise<ActivityView[]> {
  await requireStaff();
  const rows = unwrap(
    await db()
      .from("activities")
      .select(WITH_NAMES)
      .eq(entityType === "lead" ? "lead_id" : "customer_id", entityId)
      .order("created_at", { ascending: false }),
  ) as ActivityWithNames[];
  return rows.map(toView);
}

/** The latest activity across the CRM. */
export async function listRecentActivities(limit = 8): Promise<ActivityView[]> {
  await requireStaff();
  const rows = unwrap(
    await db().from("activities").select(WITH_NAMES).order("created_at", { ascending: false }).limit(limit),
  ) as ActivityWithNames[];
  return rows.map(toView);
}

export interface ActivityInput {
  entityType: Activity["entityType"];
  entityId: string;
  type: ActivityType;
  body: string;
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const { userId } = await requireStaff();
  const row = unwrap(
    await db()
      .from("activities")
      .insert({ type: input.type, body: input.body.trim(), author_id: userId, ...activitySubject(input.entityType, input.entityId) })
      .select("*")
      .single(),
  ) as ActivityRow;
  return toActivity(row);
}
