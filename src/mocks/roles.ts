import { PERMISSIONS } from "@/lib/constants";
import type { Role } from "@/types";

/** Four starting roles. An Admin can change these and add more from the Roles screen. */
export const seedRoles: Role[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Full access, including user accounts and role permissions.",
    permissions: [...PERMISSIONS],
    system: true,
  },
  {
    id: "role-sales",
    name: "Sales",
    description: "Works with customers, leads, the pipeline and follow-up tasks.",
    permissions: ["dashboard.view", "customers.view", "customers.edit", "leads.view", "leads.edit", "tasks.manage", "bookings.view"],
  },
  {
    id: "role-accountant",
    name: "Accountant",
    description: "Views customers and bookings, and the financial reports.",
    permissions: ["dashboard.view", "customers.view", "bookings.view", "reports.view"],
  },
  {
    id: "role-operations",
    name: "Operations",
    description: "Manages bookings, vehicle prices and day-to-day tasks.",
    permissions: ["dashboard.view", "customers.view", "bookings.view", "bookings.edit", "tasks.manage", "pricing.edit"],
  },
];
