import type { Metadata } from "next";
import { content } from "@/content";
import { LeadDetail } from "@/features/leads/components/lead-detail";

export const metadata: Metadata = { title: content.admin.leads.detail.details };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetail id={id} />;
}
