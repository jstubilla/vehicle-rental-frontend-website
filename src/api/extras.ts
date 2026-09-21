import { readTable } from "@/mocks/store";
import type { Extra } from "@/types";
import { simulateNetwork } from "./client";

export async function listExtras(): Promise<Extra[]> {
  await simulateNetwork();
  return readTable("extras");
}
