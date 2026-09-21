import { z } from "zod";
import type { Lead, Paginated } from "@/types";
import { LEAD_SOURCES, LEAD_STAGES } from "./constants";
import { matchesSearch, paginate, readParam, type SortDirection } from "./list-params";

export const LEAD_SORTS = ["created", "name", "stage"] as const;

/** Lead list settings, kept in the URL (?stage=new&assignee=unassigned&sort=name). */
export const leadListSchema = z.object({
  q: z.string().catch(""),
  stage: z.enum(LEAD_STAGES).optional().catch(undefined),
  source: z.enum(LEAD_SOURCES).optional().catch(undefined),
  /** A user id, or "unassigned". */
  assignee: z.string().optional().catch(undefined),
  sort: z.enum(LEAD_SORTS).catch("created"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type LeadListParams = z.infer<typeof leadListSchema>;

export const UNASSIGNED = "unassigned";

export const LEAD_NATURAL_DIRECTION: Record<(typeof LEAD_SORTS)[number], SortDirection> = {
  created: "desc",
  name: "asc",
  stage: "asc",
};

const KEYS = ["q", "stage", "source", "assignee", "sort", "dir", "page"] as const;

export function parseLeadListParams(params: URLSearchParams): LeadListParams {
  return leadListSchema.parse(Object.fromEntries(KEYS.map((key) => [key, readParam(params, key)])));
}

export function applyLeadListParams(base: URLSearchParams, value: LeadListParams): URLSearchParams {
  const next = new URLSearchParams(base);
  KEYS.forEach((key) => next.delete(key));
  if (value.q) next.set("q", value.q);
  if (value.stage) next.set("stage", value.stage);
  if (value.source) next.set("source", value.source);
  if (value.assignee) next.set("assignee", value.assignee);
  if (value.sort !== "created" || value.dir !== "desc") {
    next.set("sort", value.sort);
    next.set("dir", value.dir);
  }
  if (value.page > 1) next.set("page", String(value.page));
  return next;
}

export function countActiveLeadFilters(params: LeadListParams): number {
  return [params.stage, params.source, params.assignee].filter(Boolean).length;
}

export type LeadRow = Lead & { vehicleName: string | null; assigneeName: string | null };

/** Search, filter, sort and paginate leads. A real API would do this on the server. */
export function searchLeads(rows: LeadRow[], params: LeadListParams): Paginated<LeadRow> {
  const factor = params.dir === "asc" ? 1 : -1;
  const compare: Record<LeadListParams["sort"], (a: LeadRow, b: LeadRow) => number> = {
    created: (a, b) => a.createdAt.localeCompare(b.createdAt),
    name: (a, b) => a.name.localeCompare(b.name),
    // Stage order is the pipeline order (New first, Lost last), not alphabetical.
    stage: (a, b) => LEAD_STAGES.indexOf(a.stage) - LEAD_STAGES.indexOf(b.stage),
  };

  const matches = rows
    .filter((row) => !params.stage || row.stage === params.stage)
    .filter((row) => !params.source || row.source === params.source)
    .filter((row) => {
      if (!params.assignee) return true;
      return params.assignee === UNASSIGNED ? row.assigneeId === null : row.assigneeId === params.assignee;
    })
    .filter((row) =>
      matchesSearch([row.name, row.email, row.phone, ...row.additionalContacts.map((c) => c.value)], params.q),
    )
    .sort((a, b) => factor * compare[params.sort](a, b) || b.createdAt.localeCompare(a.createdAt));

  return paginate(matches, params.page);
}
