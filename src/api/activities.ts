import type { ActivityType } from "@/lib/constants";
import { sessionCan } from "@/lib/session";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity } from "@/types";
import { assertCan } from "./auth";
import { simulateNetwork } from "./client";

/** An activity plus the names needed to display it. */
export interface ActivityView extends Activity {
  authorName: string | null;
  /** Name of the lead or customer it belongs to. */
  entityName: string | null;
}

function withNames(activities: Activity[]): ActivityView[] {
  const users = readTable("users");
  const leads = readTable("leads");
  const customers = readTable("customers");
  return activities.map((activity) => ({
    ...activity,
    authorName: users.find((u) => u.id === activity.authorId)?.name ?? null,
    entityName:
      (activity.entityType === "lead" ? leads : customers).find((row) => row.id === activity.entityId)?.name ?? null,
  }));
}

const newestFirst = (a: Activity, b: Activity) => b.createdAt.localeCompare(a.createdAt);

/** The activity log of one lead or customer. */
export async function listActivities(entityType: Activity["entityType"], entityId: string): Promise<ActivityView[]> {
  assertCan(entityType === "lead" ? "leads.view" : "customers.view");
  await simulateNetwork();
  return withNames(
    readTable("activities")
      .filter((a) => a.entityType === entityType && a.entityId === entityId)
      .sort(newestFirst),
  );
}

/** The latest activity across the CRM, limited to what the signed-in role may see. */
export async function listRecentActivities(limit = 8): Promise<ActivityView[]> {
  const session = assertCan("dashboard.view");
  await simulateNetwork();
  return withNames(
    readTable("activities")
      .filter((a) => sessionCan(session, a.entityType === "lead" ? "leads.view" : "customers.view"))
      .sort(newestFirst)
      .slice(0, limit),
  );
}

export interface ActivityInput {
  entityType: Activity["entityType"];
  entityId: string;
  type: ActivityType;
  body: string;
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const session = assertCan(input.entityType === "lead" ? "leads.edit" : "customers.edit");
  await simulateNetwork();

  const activity: Activity = {
    id: newId("act"),
    type: input.type,
    body: input.body.trim(),
    entityType: input.entityType,
    entityId: input.entityId,
    authorId: session.userId,
    createdAt: new Date().toISOString(),
  };
  writeTable("activities", [activity, ...readTable("activities")]);
  return activity;
}
