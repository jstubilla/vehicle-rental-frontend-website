import { readTable } from "@/mocks/store";
import { searchVehicleList, type VehicleFilters } from "@/lib/vehicle-filters";
import type { Paginated, Vehicle } from "@/types";
import { simulateNetwork } from "./client";

/** All vehicles that can be shown to the public (everything except "inactive"). */
export async function listVehicles(): Promise<Vehicle[]> {
  await simulateNetwork();
  return readTable("vehicles").filter((v) => v.status !== "inactive");
}

export async function searchVehicles(filters: VehicleFilters): Promise<Paginated<Vehicle>> {
  await simulateNetwork();
  return searchVehicleList(readTable("vehicles"), filters);
}

export async function listFeaturedVehicles(): Promise<Vehicle[]> {
  await simulateNetwork();
  return readTable("vehicles").filter((v) => v.featured && v.status !== "inactive");
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  await simulateNetwork();
  return readTable("vehicles").find((v) => v.slug === slug && v.status !== "inactive") ?? null;
}
