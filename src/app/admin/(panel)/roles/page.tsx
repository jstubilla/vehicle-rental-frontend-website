import type { Metadata } from "next";
import { content } from "@/content";
import { RoleTable } from "@/features/roles/components/role-table";

export const metadata: Metadata = { title: content.admin.roles.title };

export default function RolesPage() {
  return <RoleTable />;
}
