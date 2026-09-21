import { z } from "zod";
import type { Customer, Paginated } from "@/types";
import { matchesSearch, paginate, readParam, type SortDirection } from "./list-params";

export const CUSTOMER_SORTS = ["name", "created", "bookings"] as const;

/** Customer list settings, kept in the URL (?q=maria&sort=bookings&dir=desc&page=2). */
export const customerListSchema = z.object({
  q: z.string().catch(""),
  sort: z.enum(CUSTOMER_SORTS).catch("name"),
  dir: z.enum(["asc", "desc"]).catch("asc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type CustomerListParams = z.infer<typeof customerListSchema>;

export const CUSTOMER_NATURAL_DIRECTION: Record<(typeof CUSTOMER_SORTS)[number], SortDirection> = {
  name: "asc",
  created: "desc",
  bookings: "desc",
};

export function parseCustomerListParams(params: URLSearchParams): CustomerListParams {
  return customerListSchema.parse({
    q: readParam(params, "q"),
    sort: readParam(params, "sort"),
    dir: readParam(params, "dir"),
    page: readParam(params, "page"),
  });
}

export function applyCustomerListParams(base: URLSearchParams, value: CustomerListParams): URLSearchParams {
  const next = new URLSearchParams(base);
  ["q", "sort", "dir", "page"].forEach((key) => next.delete(key));
  if (value.q) next.set("q", value.q);
  if (value.sort !== "name" || value.dir !== "asc") {
    next.set("sort", value.sort);
    next.set("dir", value.dir);
  }
  if (value.page > 1) next.set("page", String(value.page));
  return next;
}

export type CustomerRow = Customer & { bookingCount: number };

/** Search, sort and paginate customers. A real API would do this on the server. */
export function searchCustomers(rows: CustomerRow[], params: CustomerListParams): Paginated<CustomerRow> {
  const factor = params.dir === "asc" ? 1 : -1;
  const compare: Record<CustomerListParams["sort"], (a: CustomerRow, b: CustomerRow) => number> = {
    name: (a, b) => a.name.localeCompare(b.name),
    created: (a, b) => a.createdAt.localeCompare(b.createdAt),
    bookings: (a, b) => a.bookingCount - b.bookingCount || a.name.localeCompare(b.name),
  };

  const matches = rows
    .filter((row) =>
      matchesSearch([row.name, row.email, row.phone, ...row.additionalContacts.map((c) => c.value)], params.q),
    )
    .sort((a, b) => factor * compare[params.sort](a, b));

  return paginate(matches, params.page);
}
