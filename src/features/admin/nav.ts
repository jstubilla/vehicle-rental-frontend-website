import { content } from "@/content";

/**
 * The admin sidebar. Every signed-in staff member is an admin, so everyone sees every entry.
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
  { href: "/admin/reviews", label: content.admin.nav.reviews },
  { href: "/admin/users", label: content.admin.nav.users },
] as const;

export const ADMIN_NAV = NAV_ITEMS;
