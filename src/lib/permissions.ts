import type { Permission } from "./constants";

/**
 * Which permission each admin page needs. Used by the route guard (proxy.ts) and by
 * the sidebar. A path uses the most specific match, e.g. /admin/customers/cus-01
 * is covered by "/admin/customers". Order matters: it is also the order the
 * "first page you are allowed to open" is chosen in.
 */
export const ADMIN_ROUTE_PERMISSIONS: readonly { path: string; exact?: boolean; permission: Permission }[] = [
  { path: "/admin", exact: true, permission: "dashboard.view" },
  { path: "/admin/customers", permission: "customers.view" },
  { path: "/admin/leads", permission: "leads.view" },
  { path: "/admin/pipeline", permission: "leads.view" },
  { path: "/admin/tasks", permission: "tasks.manage" },
  { path: "/admin/bookings", permission: "bookings.view" },
  { path: "/admin/reports", permission: "reports.view" },
  { path: "/admin/pricing", permission: "pricing.edit" },
  { path: "/admin/users", permission: "users.manage" },
  { path: "/admin/roles", permission: "roles.manage" },
];

/** The permission needed for a path, or null if any signed-in user may open it. */
export function requiredPermission(pathname: string): Permission | null {
  const match = ADMIN_ROUTE_PERMISSIONS.find((route) =>
    route.exact ? pathname === route.path : pathname === route.path || pathname.startsWith(`${route.path}/`),
  );
  return match?.permission ?? null;
}

/** Where to send someone after login: the first page their role allows. */
export function firstAllowedPath(permissions: readonly Permission[]): string | null {
  return ADMIN_ROUTE_PERMISSIONS.find((route) => permissions.includes(route.permission))?.path ?? null;
}

/** The permissions as shown on the Roles screen, in groups. */
export const PERMISSION_GROUPS: readonly { id: "dashboard" | "customers" | "leads" | "tasks" | "bookings" | "money" | "admin"; permissions: readonly Permission[] }[] = [
  { id: "dashboard", permissions: ["dashboard.view"] },
  { id: "customers", permissions: ["customers.view", "customers.edit"] },
  { id: "leads", permissions: ["leads.view", "leads.edit"] },
  { id: "tasks", permissions: ["tasks.manage"] },
  { id: "bookings", permissions: ["bookings.view", "bookings.edit"] },
  { id: "money", permissions: ["reports.view", "pricing.edit"] },
  { id: "admin", permissions: ["users.manage", "roles.manage"] },
];

/** Editing something needs permission to see it first. */
export const PERMISSION_REQUIRES: Partial<Record<Permission, Permission>> = {
  "customers.edit": "customers.view",
  "leads.edit": "leads.view",
  "bookings.edit": "bookings.view",
};

/** Adds the "view" permission for every "edit" permission that is present, and removes duplicates. */
export function withRequiredPermissions(permissions: readonly Permission[]): Permission[] {
  const result = new Set<Permission>(permissions);
  for (const permission of permissions) {
    const required = PERMISSION_REQUIRES[permission];
    if (required) result.add(required);
  }
  return [...result];
}
