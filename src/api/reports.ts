import { buildReport, isValidRange, type ReportData, type ReportRange } from "@/lib/reports";
import { readTable } from "@/mocks/store";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

/** Numbers for the Reports screen. A real API would run these as database queries. */
export async function getReport(range: ReportRange): Promise<ReportData> {
  assertCan("reports.view");
  await simulateNetwork();
  if (!isValidRange(range)) throw new ApiError("Invalid date range", 400, "unknown");

  return buildReport(
    { leads: readTable("leads"), customers: readTable("customers"), bookings: readTable("bookings") },
    range,
  );
}
