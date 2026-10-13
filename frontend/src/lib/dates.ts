import { BUSINESS_TIME_ZONE, BUSINESS_UTC_OFFSET } from "./constants";

/** Today's date in the business time zone (Manila), as "yyyy-MM-dd". */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE }).format(now);
}

/** Adds days to an ISO date ("yyyy-MM-dd") and returns an ISO date. */
export function addDaysISO(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Converts a Manila date + "HH:mm" time to a timestamp (ms). */
export function toTimestamp(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00${BUSINESS_UTC_OFFSET}`);
}

/** e.g. "Fri, 3 Oct 2026" */
export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** e.g. "10:00 AM" from "10:00" */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** e.g. "Sep 21, 2026, 3:20 PM" (Manila time) from an ISO timestamp. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(iso));
}

/** e.g. "3 days ago", "yesterday", "in 2 hours" from an ISO timestamp. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(0, "second");
}

/** e.g. "Sep 21, 2026" (Manila time) from an ISO timestamp. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: BUSINESS_TIME_ZONE }).format(new Date(iso));
}

/** The Manila calendar date ("yyyy-MM-dd") of an ISO timestamp. */
export function toManilaDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE }).format(new Date(iso));
}

/** "Sep 2026" from a month key like "2026-09". */
export function formatMonth(monthKey: string): string {
  return new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${monthKey}-01T00:00:00Z`),
  );
}
