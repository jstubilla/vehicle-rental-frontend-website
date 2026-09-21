import { LEAD_STAGES, type LeadStage } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { sessionCan } from "@/lib/session";
import { readTable } from "@/mocks/store";
import { assertCan } from "./auth";
import { simulateNetwork } from "./client";

/** Headline numbers. A section is null when the signed-in role may not see that data. */
export interface DashboardSummary {
  leads: { open: number; new: number; byStage: Record<LeadStage, number> } | null;
  customers: { total: number; newThisMonth: number } | null;
  bookings: { active: number; pending: number } | null;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const session = assertCan("dashboard.view");
  await simulateNetwork();

  let leads: DashboardSummary["leads"] = null;
  if (sessionCan(session, "leads.view")) {
    const rows = readTable("leads");
    const byStage = Object.fromEntries(
      LEAD_STAGES.map((stage) => [stage, rows.filter((l) => l.stage === stage).length]),
    ) as Record<LeadStage, number>;
    leads = { open: rows.filter((l) => l.stage !== "won" && l.stage !== "lost").length, new: byStage.new, byStage };
  }

  let customers: DashboardSummary["customers"] = null;
  if (sessionCan(session, "customers.view")) {
    const rows = readTable("customers");
    const month = todayISO().slice(0, 7);
    customers = { total: rows.length, newThisMonth: rows.filter((c) => c.createdAt.slice(0, 7) === month).length };
  }

  let bookings: DashboardSummary["bookings"] = null;
  if (sessionCan(session, "bookings.view")) {
    const rows = readTable("bookings");
    bookings = {
      active: rows.filter((b) => b.status === "active").length,
      pending: rows.filter((b) => b.status === "pending").length,
    };
  }

  return { leads, customers, bookings };
}
