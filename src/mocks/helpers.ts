import { addDaysISO, todayISO } from "@/lib/dates";

/** An ISO date N days from today (negative = in the past). Keeps demo data looking current. */
export const dayOffset = (n: number): string => addDaysISO(todayISO(), n);

/** An ISO timestamp N days from today at a given Manila time. */
export const timestampAt = (n: number, time = "09:00"): string => `${dayOffset(n)}T${time}:00+08:00`;
