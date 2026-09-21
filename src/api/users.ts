import type { Permission } from "@/lib/constants";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Role, User } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

/**
 * Staff list, used for "assigned to" pickers and to show who wrote an activity.
 * Any signed-in staff member may read it.
 */
export async function listUsers(): Promise<User[]> {
  await simulateNetwork();
  return readTable("users");
}

export async function listRoles(): Promise<Role[]> {
  await simulateNetwork();
  return readTable("roles");
}

/** Refuses a change that would leave nobody able to manage users and roles (everyone locked out). */
export function assertManagersRemain(users: User[], roles: Role[]): void {
  const someone = (permission: Permission) =>
    users.some((user) => user.active && roles.find((role) => role.id === user.roleId)?.permissions.includes(permission));
  if (!someone("users.manage") || !someone("roles.manage")) {
    throw new ApiError("At least one active user must be able to manage users and roles", 409, "last_admin");
  }
}

/* ---------- Staff accounts (Users screen) ---------- */

export interface StaffRow extends User {
  roleName: string;
}

export async function listStaff(): Promise<StaffRow[]> {
  assertCan("users.manage");
  await simulateNetwork();
  const roles = readTable("roles");
  return readTable("users")
    .map((user) => ({ ...user, roleName: roles.find((r) => r.id === user.roleId)?.name ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface UserInput {
  name: string;
  email: string;
  roleId: string;
  active: boolean;
}

function assertEmailFree(users: User[], email: string, exceptId?: string) {
  if (users.some((u) => u.id !== exceptId && u.email.toLowerCase() === email)) {
    throw new ApiError("Another user already has this email", 409, "duplicate_email");
  }
}

export async function createUser(input: UserInput): Promise<User> {
  assertCan("users.manage");
  await simulateNetwork();

  const users = readTable("users");
  const email = input.email.trim().toLowerCase();
  assertEmailFree(users, email);
  if (!readTable("roles").some((r) => r.id === input.roleId)) throw new ApiError("Role not found", 404, "not_found");

  const user: User = {
    id: newId("usr"),
    name: input.name.trim(),
    email,
    roleId: input.roleId,
    active: input.active,
    createdAt: new Date().toISOString(),
  };
  writeTable("users", [user, ...users]);
  return user;
}

export async function updateUser(id: string, input: UserInput): Promise<User> {
  const session = assertCan("users.manage");
  await simulateNetwork();

  const users = readTable("users");
  const existing = users.find((u) => u.id === id);
  if (!existing) throw new ApiError("User not found", 404, "not_found");
  const email = input.email.trim().toLowerCase();
  assertEmailFree(users, email, id);
  if (session.userId === id && !input.active) throw new ApiError("You cannot deactivate yourself", 409, "self_deactivate");

  const roles = readTable("roles");
  if (!roles.some((r) => r.id === input.roleId)) throw new ApiError("Role not found", 404, "not_found");

  const updated: User = { ...existing, name: input.name.trim(), email, roleId: input.roleId, active: input.active };
  const next = users.map((u) => (u.id === id ? updated : u));
  assertManagersRemain(next, roles);
  writeTable("users", next);
  return updated;
}

/** Turns an account off or back on. Deactivated people cannot sign in; their records stay. */
export async function setUserActive(id: string, active: boolean): Promise<User> {
  const session = assertCan("users.manage");
  await simulateNetwork();

  const users = readTable("users");
  const existing = users.find((u) => u.id === id);
  if (!existing) throw new ApiError("User not found", 404, "not_found");
  if (session.userId === id && !active) throw new ApiError("You cannot deactivate yourself", 409, "self_deactivate");

  const updated: User = { ...existing, active };
  const next = users.map((u) => (u.id === id ? updated : u));
  assertManagersRemain(next, readTable("roles"));
  writeTable("users", next);
  return updated;
}
