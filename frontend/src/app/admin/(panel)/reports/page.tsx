import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { ReportsView } from "@/features/reports/components/reports-view";

export const metadata: Metadata = { title: content.admin.reports.title };

export default function ReportsPage() {
  // The date range lives in the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ReportsView />
    </Suspense>
  );
}
