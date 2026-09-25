import { newId, readTable, writeTable } from "@/mocks/store";
import type { User } from "@/types";
import { assertAdmin } from "./auth";
import { ApiError, simulateNetwork } from "./client";

/**
 * Staff list, used for "assigned to" pickers and to show who wrote an activity.
 * Any signed-in staff member may read it.
 */
export async function listUsers(): Promise<User[]> {
  await simulateNetwork();
  return readTable("users");
}

/** Refuses a change that would leave nobody able to sign in (everyone locked out). */
export function assertSomeoneActive(users: User[]): void {
  if (!users.some((user) => user.active)) {
    throw new ApiError("At least one account must stay active", 409, "last_admin");
  }
}

/* ---------- Staff accounts (Users screen) ---------- */

export async function listStaff(): Promise<User[]> {
  assertAdmin();
  await simulateNetwork();
  return readTable("users").sort((a, b) => a.name.localeCompare(b.name));
}

export interface UserInput {
  name: string;
  email: string;
  active: boolean;
}

function assertEmailFree(users: User[], email: string, exceptId?: string) {
  if (users.some((u) => u.id !== exceptId && u.email.toLowerCase() === email)) {
    throw new ApiError("Another user already has this email", 409, "duplicate_email");
  }
}

export async function createUser(input: UserInput): Promise<User> {
  assertAdmin();
  await simulateNetwork();

  const users = readTable("users");
  const email = input.email.trim().toLowerCase();
  assertEmailFree(users, email);

  const user: User = {
    id: newId("usr"),
    name: input.name.trim(),
    email,
    active: input.active,
    createdAt: new Date().toISOString(),
  };
  writeTable("users", [user, ...users]);
  return user;
}

export async function updateUser(id: string, input: UserInput): Promise<User> {
  const session = assertAdmin();
  await simulateNetwork();

  const users = readTable("users");
  const existing = users.find((u) => u.id === id);
  if (!existing) throw new ApiError("User not found", 404, "not_found");
  const email = input.email.trim().toLowerCase();
  assertEmailFree(users, email, id);
  if (session.userId === id && !input.active) throw new ApiError("You cannot deactivate yourself", 409, "self_deactivate");

  const updated: User = { ...existing, name: input.name.trim(), email, active: input.active };
  const next = users.map((u) => (u.id === id ? updated : u));
  assertSomeoneActive(next);
  writeTable("users", next);
  return updated;
}

/** Turns an account off or back on. Deactivated people cannot sign in; their records stay. */
export async function setUserActive(id: string, active: boolean): Promise<User> {
  const session = assertAdmin();
  await simulateNetwork();

  const users = readTable("users");
  const existing = users.find((u) => u.id === id);
  if (!existing) throw new ApiError("User not found", 404, "not_found");
  if (session.userId === id && !active) throw new ApiError("You cannot deactivate yourself", 409, "self_deactivate");

  const updated: User = { ...existing, active };
  const next = users.map((u) => (u.id === id ? updated : u));
  assertSomeoneActive(next);
  writeTable("users", next);
  return updated;
}
