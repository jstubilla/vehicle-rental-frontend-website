import { searchVehicleList, type VehicleFilters } from "@/lib/vehicle-filters";
import type { Paginated, Vehicle } from "@/types";
import { toApiError, unwrap } from "./client";
import { toVehicle, type VehicleRow } from "./rows";
import { db, isSupabaseConfigured } from "./supabase";

/**
 * The vehicle catalog. Visitors only ever see vehicle types that are not "inactive" (the database's
 * row-level security hides those); staff see them all, which is why the filters below repeat it.
 * Without a Supabase connection the catalog is empty, so the public pages still build and render.
 */

async function listAll(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = unwrap(await db().from("vehicles").select("*").order("sort_order"));
  return (rows as VehicleRow[]).map(toVehicle);
}

/** All vehicles that can be shown to the public (everything except "inactive"). */
export async function listVehicles(): Promise<Vehicle[]> {
  return (await listAll()).filter((v) => v.status !== "inactive");
}

export async function searchVehicles(filters: VehicleFilters): Promise<Paginated<Vehicle>> {
  return searchVehicleList(await listAll(), filters);
}

export async function listFeaturedVehicles(): Promise<Vehicle[]> {
  return (await listVehicles()).filter((v) => v.featured);
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await db().from("vehicles").select("*").eq("slug", slug).neq("status", "inactive").maybeSingle();
  if (error) throw toApiError(error);
  return data ? toVehicle(data as VehicleRow) : null;
}
