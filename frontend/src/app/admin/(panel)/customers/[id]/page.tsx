import type { Metadata } from "next";
import { content } from "@/content";
import { CustomerProfile } from "@/features/customers/components/customer-profile";

export const metadata: Metadata = { title: content.admin.customers.profile.details };

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerProfile id={id} />;
}
