import { readTable, writeTable } from "@/mocks/store";
import type { Vehicle } from "@/types";
import { assertAdmin } from "./auth";
import { ApiError, simulateNetwork } from "./client";

export const MIN_DAILY_RATE = 100;
export const MAX_DAILY_RATE = 100_000;

/** Every vehicle (including ones taken off the public site), for the Pricing screen. */
export async function listVehiclePrices(): Promise<Vehicle[]> {
  assertAdmin();
  await simulateNetwork();
  return readTable("vehicles").sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Changes a vehicle's flat daily rate. Only new bookings use it: existing bookings
 * keep the rate they were made at (see the Booking model).
 */
export async function updateVehiclePrice(vehicleId: string, pricePerDay: number): Promise<Vehicle> {
  assertAdmin();
  await simulateNetwork();

  if (!Number.isInteger(pricePerDay) || pricePerDay < MIN_DAILY_RATE || pricePerDay > MAX_DAILY_RATE) {
    throw new ApiError("Invalid price", 400, "invalid_price");
  }
  const vehicles = readTable("vehicles");
  const existing = vehicles.find((v) => v.id === vehicleId);
  if (!existing) throw new ApiError("Vehicle not found", 404, "not_found");

  const updated: Vehicle = { ...existing, pricePerDay };
  writeTable("vehicles", vehicles.map((v) => (v.id === vehicleId ? updated : v)));
  return updated;
}
