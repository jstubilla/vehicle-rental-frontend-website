import { z } from "zod";
import type { Booking, Customer, Lead } from "@/types";
import { LEAD_STAGES, type BookingStatus, type LeadStage } from "./constants";
import { addDaysISO, todayISO, toManilaDate } from "./dates";
import { readParam } from "./list-params";

/**
 * Report rules.
 * - Leads and customers are counted by the day they were created.
 * - Bookings are counted by pick-up date. Revenue only counts bookings that are
 *   confirmed, active or completed (not pending or cancelled).
 */
export const REVENUE_STATUSES: readonly BookingStatus[] = ["confirmed", "active", "completed"];

export interface MonthCount {
  month: string;
  count: number;
}

export interface MonthRevenue {
  month: string;
  bookings: number;
  revenue: number;
}

export interface ReportData {
  from: string;
  to: string;
  leadsByStage: Record<LeadStage, number>;
  totalLeads: number;
  leadsByMonth: MonthCount[];
  customersByMonth: MonthCount[];
  bookingsByMonth: MonthRevenue[];
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** The date range, kept in the URL (?from=2026-04-01&to=2026-09-30). */
export interface ReportRange {
  from: string;
  to: string;
}

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

/** First and last day of the month `offset` months from the given date's month. */
function shiftMonths(iso: string, offset: number): string {
  const date = new Date(`${monthStart(iso)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}

const endOfMonth = (iso: string) => addDaysISO(shiftMonths(iso, 1), -1);

/** Default: the last six months, up to the end of this month. */
export function defaultRange(today = todayISO()): ReportRange {
  return { from: shiftMonths(today, -5), to: endOfMonth(today) };
}

export const RANGE_PRESETS = {
  last30: (today = todayISO()): ReportRange => ({ from: addDaysISO(today, -29), to: today }),
  last6Months: (today = todayISO()): ReportRange => defaultRange(today),
  thisYear: (today = todayISO()): ReportRange => ({ from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` }),
};

export function parseRange(params: URLSearchParams): ReportRange {
  const fallback = defaultRange();
  const from = isoDate.safeParse(readParam(params, "from"));
  const to = isoDate.safeParse(readParam(params, "to"));
  return { from: from.success ? from.data : fallback.from, to: to.success ? to.data : fallback.to };
}

export function applyRange(base: URLSearchParams, range: ReportRange): URLSearchParams {
  const next = new URLSearchParams(base);
  next.set("from", range.from);
  next.set("to", range.to);
  return next;
}

export const isValidRange = (range: ReportRange) => range.from <= range.to;

/** Every month key ("2026-05") from the month of `from` to the month of `to`. */
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let cursor = monthStart(from);
  const last = monthStart(to);
  while (cursor <= last && months.length < 240) {
    months.push(cursor.slice(0, 7));
    cursor = shiftMonths(cursor, 1);
  }
  return months;
}

const within = (date: string, range: ReportRange) => date >= range.from && date <= range.to;

export function buildReport(
  data: { leads: Lead[]; customers: Customer[]; bookings: Booking[] },
  range: ReportRange,
): ReportData {
  const months = monthsBetween(range.from, range.to);

  const leads = data.leads.filter((lead) => within(toManilaDate(lead.createdAt), range));
  const customers = data.customers.filter((customer) => within(toManilaDate(customer.createdAt), range));
  const bookings = data.bookings.filter(
    (booking) => booking.status !== "cancelled" && within(booking.pickupDate, range),
  );
  const paying = bookings.filter((booking) => REVENUE_STATUSES.includes(booking.status));

  const leadsByStage = Object.fromEntries(
    LEAD_STAGES.map((stage) => [stage, leads.filter((lead) => lead.stage === stage).length]),
  ) as Record<LeadStage, number>;

  return {
    ...range,
    leadsByStage,
    totalLeads: leads.length,
    leadsByMonth: months.map((month) => ({
      month,
      count: leads.filter((lead) => toManilaDate(lead.createdAt).startsWith(month)).length,
    })),
    customersByMonth: months.map((month) => ({
      month,
      count: customers.filter((customer) => toManilaDate(customer.createdAt).startsWith(month)).length,
    })),
    bookingsByMonth: months.map((month) => {
      const inMonth = paying.filter((booking) => booking.pickupDate.startsWith(month));
      return { month, bookings: inMonth.length, revenue: inMonth.reduce((sum, booking) => sum + booking.total, 0) };
    }),
    totalCustomers: customers.length,
    totalBookings: bookings.length,
    totalRevenue: paying.reduce((sum, booking) => sum + booking.total, 0),
  };
}
