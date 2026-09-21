import type { Metadata } from "next";
import { content } from "@/content";
import { UserTable } from "@/features/users/components/user-table";

export const metadata: Metadata = { title: content.admin.users.title };

export default function UsersPage() {
  return <UserTable />;
}
