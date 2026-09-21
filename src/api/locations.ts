import { readTable } from "@/mocks/store";
import type { Location } from "@/types";
import { simulateNetwork } from "./client";

export async function listLocations(): Promise<Location[]> {
  await simulateNetwork();
  return readTable("locations");
}
