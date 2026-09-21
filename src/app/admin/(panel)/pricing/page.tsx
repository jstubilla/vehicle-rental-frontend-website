import type { Metadata } from "next";
import { content } from "@/content";
import { PricingTable } from "@/features/pricing/components/pricing-table";

export const metadata: Metadata = { title: content.admin.pricing.title };

export default function PricingPage() {
  return <PricingTable />;
}
