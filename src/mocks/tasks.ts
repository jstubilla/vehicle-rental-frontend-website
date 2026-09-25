import type { TaskStatus } from "@/lib/constants";
import type { Task } from "@/types";
import { dayOffset, timestampAt } from "./helpers";

type Row = [
  title: string,
  linked: string | null, // "lead-03" or "cus-01"
  dueInDays: number,
  assignee: string | null,
  status: TaskStatus,
  notes: string,
];

// 10 tasks: 8 open (two of them overdue) and 2 done. Dates are relative to today.
const rows: Row[] = [
  ["Call back Hazel about airport pick-up rates", "lead-03", 0, "usr-03", "open", "She asked for NAIA and Clark prices."],
  ["Send quotation to Trisha Valdez", "lead-05", 1, "usr-02", "open", "7-seater, automatic, weekend rental."],
  ["Follow up Gerald Uy on the quotation", "lead-06", -2, "usr-03", "open", ""],
  ["Confirm pick-up details with Juan Dela Cruz", "cus-01", 2, "usr-05", "open", "NAIA pick-up, 10:00 AM."],
  ["Prepare monthly invoice for Mark Villanueva", "cus-05", 5, "usr-04", "open", "Corporate account. Send to accounts@villanueva-logistics.example."],
  ["Prepare a wedding van quote for Vincent Ang", "lead-10", 1, "usr-02", "open", "14 guests. Suggest a van plus one sedan."],
  ["Explain EV charging to Lorna Feliciano", "lead-09", 3, "usr-03", "open", ""],
  ["Follow up with Bea Salonga about the Cebu rental", "lead-07", -1, "usr-02", "open", ""],
  ["Ask Camille Rivera for the next tour dates", "cus-20", -5, "usr-02", "done", "Sent a message. Waiting for the schedule."],
  ["Send a thank-you note to Mark Villanueva", "cus-05", -20, "usr-02", "done", ""],
];

export const seedTasks: Task[] = rows.map(([title, linked, due, assigneeId, status, notes], index) => ({
  id: `task-${String(index + 1).padStart(2, "0")}`,
  title,
  notes,
  dueDate: dayOffset(due),
  assigneeId,
  status,
  linkedType: linked ? (linked.startsWith("lead") ? "lead" : "customer") : null,
  linkedId: linked,
  createdAt: timestampAt(due - 4),
  completedAt: status === "done" ? timestampAt(due) : null,
}));
