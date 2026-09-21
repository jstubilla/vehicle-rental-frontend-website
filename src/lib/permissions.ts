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
