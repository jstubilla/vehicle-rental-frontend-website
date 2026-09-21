import type { ActivityType } from "@/lib/constants";
import type { Activity } from "@/types";
import { timestampAt } from "./helpers";

type Row = [
  entity: string,
  type: ActivityType,
  body: string,
  author: string | null,
  daysAgo: number,
  time: string,
];

// 30 activities spread over leads and customers. Newest come from the website (no author).
const rows: Row[] = [
  ["lead-01", "note", "Website inquiry received: Looking for a sedan for 5 days in October.", null, 1, "10:30"],
  ["lead-04", "note", "Website inquiry received: Need a 12-seater van for a company outing.", null, 1, "16:05"],
  ["lead-02", "note", "Lead created from a Facebook message.", null, 2, "09:12"],
  ["lead-03", "call", "Called back and will email the airport pick-up rates.", "usr-03", 2, "15:40"],
  ["lead-05", "status_change", "Stage changed from New to Contacted.", "usr-02", 5, "11:20"],
  ["lead-05", "call", "Discussed dates. Needs 7 seats and prefers automatic.", "usr-02", 5, "11:25"],
  ["lead-06", "status_change", "Stage changed from New to Contacted.", "usr-03", 7, "10:05"],
  ["lead-06", "note", "Sent a quotation for 3 days.", "usr-03", 7, "10:40"],
  ["lead-07", "status_change", "Stage changed from New to Contacted.", "usr-02", 8, "13:30"],
  ["lead-08", "status_change", "Stage changed from Contacted to Qualified.", "usr-02", 10, "09:45"],
  ["lead-08", "call", "Confirmed budget and project dates.", "usr-02", 10, "09:50"],
  ["lead-09", "status_change", "Stage changed from Contacted to Qualified.", "usr-03", 12, "14:10"],
  ["lead-09", "note", "Wants a test drive and an explanation of charging.", "usr-03", 12, "14:20"],
  ["lead-10", "status_change", "Stage changed from Contacted to Qualified.", "usr-02", 14, "11:00"],
  ["lead-10", "call", "Needs 14 seats. Suggested the Nissan Urvan.", "usr-02", 14, "11:15"],
  ["lead-11", "status_change", "Stage changed from Qualified to Won.", "usr-02", 28, "16:00"],
  ["lead-11", "note", "Corporate account set up with monthly invoicing.", "usr-02", 28, "16:10"],
  ["lead-12", "status_change", "Stage changed from Qualified to Won.", "usr-03", 23, "10:30"],
  ["lead-13", "status_change", "Stage changed from Qualified to Won.", "usr-02", 18, "15:00"],
  ["lead-14", "status_change", "Stage changed from Contacted to Lost.", "usr-03", 16, "12:00"],
  ["lead-14", "note", "Budget too low for the requested weekly rate.", "usr-03", 16, "12:05"],
  ["lead-15", "status_change", "Stage changed from Contacted to Lost.", "usr-02", 20, "09:30"],
  ["lead-15", "note", "Chose another company.", "usr-02", 20, "09:35"],
  ["cus-01", "note", "Frequent renter. Prefers sedans and NAIA pick-up.", "usr-02", 60, "10:00"],
  ["cus-01", "call", "Confirmed pick-up time for the upcoming rental.", "usr-05", 45, "17:30"],
  ["cus-04", "note", "Needs a child seat on every rental.", "usr-02", 50, "13:15"],
  ["cus-05", "note", "Corporate account. Invoice monthly to accounts@villanueva-logistics.example.", "usr-04", 27, "11:45"],
  ["cus-09", "call", "Asked for a copy of the invoice. Sent by email.", "usr-04", 10, "14:50"],
  ["cus-13", "note", "Books long weekend trips. Offer the Hilux next time.", "usr-05", 6, "10:20"],
  ["cus-20", "call", "Group organizer. Asked about discounts for repeat tours.", "usr-02", 4, "16:30"],
];

export const seedActivities: Activity[] = rows
  .map(([entity, type, body, authorId, daysAgo, time], index) => ({
    id: `act-${String(index + 1).padStart(2, "0")}`,
    type,
    body,
    entityType: entity.startsWith("lead") ? ("lead" as const) : ("customer" as const),
    entityId: entity,
    authorId,
    createdAt: timestampAt(-daysAgo, time),
  }))
  // Newest first, the way the app lists them.
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
