import type { Metadata } from "next";
import { content } from "@/content";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = { title: content.admin.dashboard.title };

export default function DashboardPage() {
  return <DashboardView />;
}
