import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { LeadList } from "@/features/leads/components/lead-list";

export const metadata: Metadata = { title: content.admin.leads.title };

export default function LeadsPage() {
  // The list keeps its search, filters and page in the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <LeadList />
    </Suspense>
  );
}
