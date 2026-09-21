import { readTable } from "@/mocks/store";
import type { Role, User } from "@/types";
import { simulateNetwork } from "./client";

/**
 * Staff list, used for "assigned to" pickers and to show who wrote an activity.
 * (Creating, editing and deactivating accounts is the Users screen, built in Phase 5.)
 */
export async function listUsers(): Promise<User[]> {
  await simulateNetwork();
  return readTable("users");
}

export async function listRoles(): Promise<Role[]> {
  await simulateNetwork();
  return readTable("roles");
}
