import type { Metadata } from "next";
import { content } from "@/content";
import { Confirmation } from "@/features/booking/components/confirmation";

export const metadata: Metadata = { title: content.booking.steps.confirmation };

export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <Confirmation reference={reference} />;
}
