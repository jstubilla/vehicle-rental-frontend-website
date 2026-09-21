import type { Paginated } from "@/types";

/** Shared helpers for the admin lists (customers, leads): paging and sorting. */
export const ADMIN_PAGE_SIZE = 10;

export type SortDirection = "asc" | "desc";

/** Reads a single query value, treating empty text as "not set". */
export function readParam(params: URLSearchParams, key: string): string | undefined {
  return params.get(key) || undefined;
}

export function paginate<T>(items: T[], page: number, pageSize = ADMIN_PAGE_SIZE): Paginated<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page: current, pageSize, pageCount };
}

/** Clicking a column: flips the direction if it is already sorted, otherwise sorts it in its natural direction. */
export function nextSort<K extends string>(
  current: { sort: K; dir: SortDirection },
  key: K,
  naturalDirection: Record<K, SortDirection>,
): { sort: K; dir: SortDirection } {
  if (current.sort === key) return { sort: key, dir: current.dir === "asc" ? "desc" : "asc" };
  return { sort: key, dir: naturalDirection[key] };
}

/**
 * Case-insensitive "contains" that ignores spaces, dashes and brackets, and treats
 * +63 and a leading 0 as the same, so phone numbers match however they are typed.
 */
export function matchesSearch(haystack: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const squash = (text: string) =>
    text
      .toLowerCase()
      .replace(/[\s\-()]/g, "")
      .replace(/^\+63/, "0");
  return haystack.some((text) => text.toLowerCase().includes(q) || squash(text).includes(squash(q)));
}
