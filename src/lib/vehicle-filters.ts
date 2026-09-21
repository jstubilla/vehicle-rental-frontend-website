import { z } from "zod";
import {
  CATALOG_PAGE_SIZE,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_CATEGORIES,
  VEHICLE_SORTS,
} from "./constants";
import type { Paginated, Vehicle } from "@/types";

/**
 * Catalog filters as they appear in the URL (?category=suv&sort=price-asc&page=2).
 * Anything invalid in the URL is silently dropped, so shared links never break the page.
 */
export const vehicleFiltersSchema = z.object({
  category: z.enum(VEHICLE_CATEGORIES).optional().catch(undefined),
  transmission: z.enum(TRANSMISSIONS).optional().catch(undefined),
  fuel: z.enum(FUEL_TYPES).optional().catch(undefined),
  minSeats: z.coerce.number().int().min(1).max(30).optional().catch(undefined),
  minPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  maxPrice: z.coerce.number().int().min(0).optional().catch(undefined),
  sort: z.enum(VEHICLE_SORTS).catch("price-asc"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;

export const FILTER_QUERY_KEYS = [
  "category",
  "transmission",
  "fuel",
  "minSeats",
  "minPrice",
  "maxPrice",
  "sort",
  "page",
] as const;

const DEFAULT_FILTERS: VehicleFilters = { sort: "price-asc", page: 1 };

export function parseVehicleFilters(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): VehicleFilters {
  const get = (key: string) => {
    const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
    return (Array.isArray(raw) ? raw[0] : raw) || undefined;
  };
  return vehicleFiltersSchema.parse(Object.fromEntries(FILTER_QUERY_KEYS.map((key) => [key, get(key)])));
}

/** Writes filters into an existing query string, leaving other params (like dates) untouched. */
export function applyFiltersToParams(base: URLSearchParams, filters: VehicleFilters): URLSearchParams {
  const next = new URLSearchParams(base);
  FILTER_QUERY_KEYS.forEach((key) => next.delete(key));
  for (const key of FILTER_QUERY_KEYS) {
    const value = filters[key];
    if (value === undefined) continue;
    if (key === "sort" && value === DEFAULT_FILTERS.sort) continue;
    if (key === "page" && value === 1) continue;
    next.set(key, String(value));
  }
  return next;
}

export function countActiveFilters(filters: VehicleFilters): number {
  const keys = ["category", "transmission", "fuel", "minSeats", "minPrice", "maxPrice"] as const;
  return keys.filter((key) => filters[key] !== undefined).length;
}

const sorters: Record<VehicleFilters["sort"], (a: Vehicle, b: Vehicle) => number> = {
  "price-asc": (a, b) => a.pricePerDay - b.pricePerDay || a.name.localeCompare(b.name),
  "price-desc": (a, b) => b.pricePerDay - a.pricePerDay || a.name.localeCompare(b.name),
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "seats-desc": (a, b) => b.seats - a.seats || a.pricePerDay - b.pricePerDay,
};

/**
 * Filter, sort and paginate. In the mock layer this runs in the browser;
 * a real API would do the same work on the server with the same inputs.
 */
export function searchVehicleList(vehicles: Vehicle[], filters: VehicleFilters): Paginated<Vehicle> {
  const matches = vehicles
    .filter((v) => v.status !== "inactive")
    .filter((v) => !filters.category || v.category === filters.category)
    .filter((v) => !filters.transmission || v.transmission === filters.transmission)
    .filter((v) => !filters.fuel || v.fuel === filters.fuel)
    .filter((v) => !filters.minSeats || v.seats >= filters.minSeats)
    .filter((v) => filters.minPrice === undefined || v.pricePerDay >= filters.minPrice)
    .filter((v) => filters.maxPrice === undefined || v.pricePerDay <= filters.maxPrice)
    .sort(sorters[filters.sort]);

  const pageCount = Math.max(1, Math.ceil(matches.length / CATALOG_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * CATALOG_PAGE_SIZE;

  return {
    items: matches.slice(start, start + CATALOG_PAGE_SIZE),
    total: matches.length,
    page,
    pageSize: CATALOG_PAGE_SIZE,
    pageCount,
  };
}
