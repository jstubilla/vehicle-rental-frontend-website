import { z } from "zod";
import type { Booking, Paginated } from "@/types";
import { BOOKING_STATUSES } from "./constants";
import { matchesSearch, paginate, readParam, type SortDirection } from "./list-params";

export const BOOKING_SORTS = ["pickup", "total", "status"] as const;

/** Booking list settings, kept in the URL (?status=pending&q=juan&sort=total). */
export const bookingListSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(BOOKING_STATUSES).optional().catch(undefined),
  sort: z.enum(BOOKING_SORTS).catch("pickup"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type BookingListParams = z.infer<typeof bookingListSchema>;

export const BOOKING_NATURAL_DIRECTION: Record<(typeof BOOKING_SORTS)[number], SortDirection> = {
  pickup: "desc",
  total: "desc",
  status: "asc",
};

const KEYS = ["q", "status", "sort", "dir", "page"] as const;

export function parseBookingListParams(params: URLSearchParams): BookingListParams {
  return bookingListSchema.parse(Object.fromEntries(KEYS.map((key) => [key, readParam(params, key)])));
}

export function applyBookingListParams(base: URLSearchParams, value: BookingListParams): URLSearchParams {
  const next = new URLSearchParams(base);
  KEYS.forEach((key) => next.delete(key));
  if (value.q) next.set("q", value.q);
  if (value.status) next.set("status", value.status);
  if (value.sort !== "pickup" || value.dir !== "desc") {
    next.set("sort", value.sort);
    next.set("dir", value.dir);
  }
  if (value.page > 1) next.set("page", String(value.page));
  return next;
}

export type BookingRow = Booking & { customerName: string; vehicleName: string; paymentStatus: "paid" | "pending" | "failed" | "processing" | null };

/** Search, filter, sort and paginate bookings. A real API would do this on the server. */
export function searchBookings(rows: BookingRow[], params: BookingListParams): Paginated<BookingRow> {
  const factor = params.dir === "asc" ? 1 : -1;
  const compare: Record<BookingListParams["sort"], (a: BookingRow, b: BookingRow) => number> = {
    pickup: (a, b) => a.pickupDate.localeCompare(b.pickupDate) || a.pickupTime.localeCompare(b.pickupTime),
    total: (a, b) => a.total - b.total,
    status: (a, b) => BOOKING_STATUSES.indexOf(a.status) - BOOKING_STATUSES.indexOf(b.status),
  };

  const matches = rows
    .filter((row) => !params.status || row.status === params.status)
    .filter((row) => matchesSearch([row.reference, row.customerName, row.vehicleName], params.q))
    .sort((a, b) => factor * compare[params.sort](a, b) || b.createdAt.localeCompare(a.createdAt));

  return paginate(matches, params.page);
}
