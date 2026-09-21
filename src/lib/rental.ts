import { z } from "zod";
import { content } from "@/content";
import { addDaysISO, todayISO, toTimestamp } from "./dates";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);

export const rentalFields = z.object({
  pickupLocation: z.string().min(1, content.validation.required),
  pickupDate: isoDate.refine((d) => d >= todayISO(), content.validation.dateInPast),
  pickupTime: time,
  returnDate: isoDate,
  returnTime: time,
});

/** The rule every rental must follow: the return comes after the pick-up. */
export const returnAfterPickup = {
  check: (v: { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string }) =>
    toTimestamp(v.returnDate, v.returnTime) > toTimestamp(v.pickupDate, v.pickupTime),
  error: { path: ["returnDate"], message: content.validation.returnBeforePickup },
};

/** Where and when: shared by the home quick search, the catalog and the booking flow. */
export const rentalSearchSchema = rentalFields.refine(returnAfterPickup.check, returnAfterPickup.error);

export type RentalSearch = z.infer<typeof rentalSearchSchema>;

export const RENTAL_QUERY_KEYS = [
  "pickupLocation",
  "pickupDate",
  "pickupTime",
  "returnDate",
  "returnTime",
] as const;

export const DEFAULT_PICKUP_TIME = "10:00";
export const DEFAULT_RETURN_TIME = "10:00";
export const DEFAULT_RENTAL_LENGTH_DAYS = 3;

/** Default dates offered on the quick search: tomorrow, for 3 days. */
export function defaultRentalDates() {
  const pickupDate = addDaysISO(todayISO(), 1);
  return { pickupDate, returnDate: addDaysISO(pickupDate, DEFAULT_RENTAL_LENGTH_DAYS) };
}

/**
 * Reads rental details from a URL query. Returns null unless every field is
 * present and valid, so a half-filled or stale link is safely ignored.
 */
export function parseRentalSearch(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): RentalSearch | null {
  const get = (key: string) => {
    const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? undefined;
  };
  const candidate = Object.fromEntries(RENTAL_QUERY_KEYS.map((key) => [key, get(key)]));
  const result = rentalSearchSchema.safeParse(candidate);
  return result.success ? result.data : null;
}

export function rentalSearchToParams(search: RentalSearch): URLSearchParams {
  return new URLSearchParams(RENTAL_QUERY_KEYS.map((key) => [key, search[key]]));
}

/**
 * Business rule: rentals are charged in 24-hour blocks, rounded up, minimum 1.
 * e.g. Mon 10:00 to Wed 11:00 = 2 days and 1 hour = 3 days.
 */
export function countRentalDays(search: Pick<RentalSearch, "pickupDate" | "pickupTime" | "returnDate" | "returnTime">): number {
  const ms =
    toTimestamp(search.returnDate, search.returnTime) - toTimestamp(search.pickupDate, search.pickupTime);
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
}

/** Flat daily rate times number of days. Extras are added on top by buildQuote in lib/pricing.ts. */
export function calcRentalTotal(pricePerDay: number, days: number): number {
  return pricePerDay * days;
}
