import type { Permission } from "@/lib/constants";
import { withRequiredPermissions } from "@/lib/permissions";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Role } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";
import { assertManagersRemain } from "./users";

export interface RoleRow extends Role {
  userCount: number;
}

export async function listRoleRows(): Promise<RoleRow[]> {
  assertCan("roles.manage");
  await simulateNetwork();
  const users = readTable("users");
  return readTable("roles").map((role) => ({ ...role, userCount: users.filter((u) => u.roleId === role.id).length }));
}

export interface RoleInput {
  name: string;
  description: string;
  permissions: Permission[];
}

function assertNameFree(roles: Role[], name: string, exceptId?: string) {
  if (roles.some((r) => r.id !== exceptId && r.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError("A role with this name already exists", 409, "duplicate_name");
  }
}

export async function createRole(input: RoleInput): Promise<Role> {
  assertCan("roles.manage");
  await simulateNetwork();

  const roles = readTable("roles");
  const name = input.name.trim();
  assertNameFree(roles, name);

  const role: Role = {
    id: newId("role"),
    name,
    description: input.description.trim(),
    permissions: withRequiredPermissions(input.permissions),
  };
  writeTable("roles", [...roles, role]);
  return role;
}

/** Changes a role. People who have it get the new permissions the next time they sign in. */
export async function updateRole(id: string, input: RoleInput): Promise<Role> {
  assertCan("roles.manage");
  await simulateNetwork();

  const roles = readTable("roles");
  const existing = roles.find((r) => r.id === id);
  if (!existing) throw new ApiError("Role not found", 404, "not_found");
  if (existing.system) throw new ApiError("The Admin role cannot be changed", 409, "system_role");

  const name = input.name.trim();
  assertNameFree(roles, name, id);

  const updated: Role = { ...existing, name, description: input.description.trim(), permissions: withRequiredPermissions(input.permissions) };
  const next = roles.map((r) => (r.id === id ? updated : r));
  assertManagersRemain(readTable("users"), next);
  writeTable("roles", next);
  return updated;
}

export async function deleteRole(id: string): Promise<void> {
  assertCan("roles.manage");
  await simulateNetwork();

  const roles = readTable("roles");
  const existing = roles.find((r) => r.id === id);
  if (!existing) throw new ApiError("Role not found", 404, "not_found");
  if (existing.system) throw new ApiError("The Admin role cannot be deleted", 409, "system_role");
  if (readTable("users").some((u) => u.roleId === id)) throw new ApiError("People still use this role", 409, "has_users");

  writeTable("roles", roles.filter((r) => r.id !== id));
}
