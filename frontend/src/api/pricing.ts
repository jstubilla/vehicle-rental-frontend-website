import type { Vehicle } from "@/types";
import { requireStaff } from "./auth";
import { ApiError, toApiError, unwrap } from "./client";
import { toVehicle, type VehicleRow } from "./rows";
import { db } from "./supabase";

export const MIN_DAILY_RATE = 100;
export const MAX_DAILY_RATE = 100_000;

/** Every vehicle (including ones taken off the public site), for the Pricing screen. */
export async function listVehiclePrices(): Promise<Vehicle[]> {
  await requireStaff();
  const rows = unwrap(await db().from("vehicles").select("*").order("name")) as VehicleRow[];
  return rows.map(toVehicle);
}

/**
 * Changes a vehicle's flat daily rate. Only new bookings use it: existing bookings keep the rate they
 * were made at (the database locks a booking's price).
 */
export async function updateVehiclePrice(vehicleId: string, pricePerDay: number): Promise<Vehicle> {
  await requireStaff();
  if (!Number.isInteger(pricePerDay) || pricePerDay < MIN_DAILY_RATE || pricePerDay > MAX_DAILY_RATE) {
    throw new ApiError("Invalid price", 400, "invalid_price");
  }
  const { data, error } = await db()
    .from("vehicles")
    .update({ price_per_day: pricePerDay })
    .eq("id", vehicleId)
    .select("*")
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("Vehicle not found", 404, "not_found");
  return toVehicle(data as VehicleRow);
}
