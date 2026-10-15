import { isWaitingForDocumentCheck } from "@/lib/booking-status";
import { LEAD_STAGES, type BookingStatus, type DocumentStatus, type LeadStage, type TaskStatus } from "@/lib/constants";
import { todayISO, toManilaDate } from "@/lib/dates";
import { requireStaff } from "./auth";
import { unwrap } from "./client";
import { db } from "./supabase";

/** Headline numbers for the dashboard. */
export interface DashboardSummary {
  leads: { open: number; new: number; byStage: Record<LeadStage, number> };
  customers: { total: number; newThisMonth: number };
  /** documentsToCheck: requests whose photos are waiting for staff to approve or reject. */
  bookings: { active: number; pending: number; documentsToCheck: number };
  tasks: { open: number; overdue: number };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await requireStaff();
  const supabase = db();
  const [leads, customers, bookings, tasks] = await Promise.all([
    supabase.from("leads").select("stage"),
    supabase.from("customers").select("created_at"),
    supabase.from("bookings").select("status, documents_status"),
    supabase.from("tasks").select("status, due_date"),
  ]);
  const leadRows = unwrap(leads) as { stage: LeadStage }[];
  const customerRows = unwrap(customers) as { created_at: string }[];
  const bookingRows = (unwrap(bookings) as { status: BookingStatus; documents_status: DocumentStatus | null }[]).map(
    (b) => ({ status: b.status, documentsStatus: b.documents_status }),
  );
  const openTasks = (unwrap(tasks) as { status: TaskStatus; due_date: string }[]).filter((t) => t.status === "open");

  const byStage = Object.fromEntries(
    LEAD_STAGES.map((stage) => [stage, leadRows.filter((l) => l.stage === stage).length]),
  ) as Record<LeadStage, number>;
  const today = todayISO();
  const month = today.slice(0, 7);

  return {
    leads: { open: leadRows.filter((l) => l.stage !== "won" && l.stage !== "lost").length, new: byStage.new, byStage },
    customers: {
      total: customerRows.length,
      newThisMonth: customerRows.filter((c) => toManilaDate(c.created_at).slice(0, 7) === month).length,
    },
    bookings: {
      active: bookingRows.filter((b) => b.status === "active").length,
      pending: bookingRows.filter((b) => b.status === "pending").length,
      documentsToCheck: bookingRows.filter(isWaitingForDocumentCheck).length,
    },
    tasks: { open: openTasks.length, overdue: openTasks.filter((t) => t.due_date < today).length },
  };
}
