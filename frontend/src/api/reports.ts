import { buildReport, isValidRange, type ReportData, type ReportRange } from "@/lib/reports";
import { requireStaff } from "./auth";
import { ApiError, unwrap } from "./client";
import { toBooking, toCustomer, toLead, type BookingRow, type CustomerRow, type LeadRow } from "./rows";
import { db } from "./supabase";

/**
 * Numbers for the Reports screen. The rows are loaded and counted here with the same rules as before
 * (src/lib/reports.ts); with many years of data, move the counting into a database view.
 */
export async function getReport(range: ReportRange): Promise<ReportData> {
  await requireStaff();
  if (!isValidRange(range)) throw new ApiError("Invalid date range", 400, "unknown");
  const supabase = db();
  const [leads, customers, bookings] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("customers").select("*"),
    supabase.from("bookings").select("*"),
  ]);
  return buildReport(
    {
      leads: (unwrap(leads) as LeadRow[]).map(toLead),
      customers: (unwrap(customers) as CustomerRow[]).map(toCustomer),
      bookings: (unwrap(bookings) as BookingRow[]).map((row) => toBooking(row, null)),
    },
    range,
  );
}
