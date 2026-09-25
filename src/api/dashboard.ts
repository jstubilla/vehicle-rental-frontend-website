import { LEAD_STAGES, type LeadStage } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { readTable } from "@/mocks/store";
import { assertAdmin } from "./auth";
import { simulateNetwork } from "./client";

/** Headline numbers for the dashboard. */
export interface DashboardSummary {
  leads: { open: number; new: number; byStage: Record<LeadStage, number> };
  customers: { total: number; newThisMonth: number };
  bookings: { active: number; pending: number };
  tasks: { open: number; overdue: number };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  assertAdmin();
  await simulateNetwork();

  const leadRows = readTable("leads");
  const byStage = Object.fromEntries(
    LEAD_STAGES.map((stage) => [stage, leadRows.filter((l) => l.stage === stage).length]),
  ) as Record<LeadStage, number>;

  const month = todayISO().slice(0, 7);
  const customerRows = readTable("customers");
  const bookingRows = readTable("bookings");
  const openTasks = readTable("tasks").filter((t) => t.status === "open");

  return {
    leads: { open: leadRows.filter((l) => l.stage !== "won" && l.stage !== "lost").length, new: byStage.new, byStage },
    customers: {
      total: customerRows.length,
      newThisMonth: customerRows.filter((c) => c.createdAt.slice(0, 7) === month).length,
    },
    bookings: {
      active: bookingRows.filter((b) => b.status === "active").length,
      pending: bookingRows.filter((b) => b.status === "pending").length,
    },
    tasks: { open: openTasks.length, overdue: openTasks.filter((t) => t.dueDate < todayISO()).length },
  };
}
