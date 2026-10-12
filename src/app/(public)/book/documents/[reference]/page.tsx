import type { Metadata } from "next";
import { content } from "@/content";
import { ResubmitDocuments } from "@/features/booking/components/resubmit-documents";

export const metadata: Metadata = { title: content.booking.resubmit.title };

/** The link we email when staff reject the customer's documents. */
export default async function NewDocumentsPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <ResubmitDocuments reference={reference} />;
}
