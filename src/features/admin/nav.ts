import { content } from "@/content";
import { requiredPermission } from "@/lib/permissions";

/**
 * The admin sidebar. Each entry appears only for roles that have the permission the
 * page needs (taken from lib/permissions.ts, so the sidebar and the route guard agree).
 * New admin pages are added here as they are built.
 */
const NAV_ITEMS = [
  { href: "/admin", label: content.admin.nav.dashboard },
  { href: "/admin/customers", label: content.admin.nav.customers },
  { href: "/admin/leads", label: content.admin.nav.leads },
  { href: "/admin/pipeline", label: content.admin.nav.pipeline },
  { href: "/admin/tasks", label: content.admin.nav.tasks },
  { href: "/admin/bookings", label: content.admin.nav.bookings },
  { href: "/admin/reports", label: content.admin.nav.reports },
  { href: "/admin/pricing", label: content.admin.nav.pricing },
  { href: "/admin/users", label: content.admin.nav.users },
  { href: "/admin/roles", label: content.admin.nav.roles },
] as const;

export const ADMIN_NAV = NAV_ITEMS.map((item) => ({ ...item, permission: requiredPermission(item.href) }));
