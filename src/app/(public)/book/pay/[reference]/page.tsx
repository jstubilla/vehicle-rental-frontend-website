import type { Metadata } from "next";
import { content } from "@/content";
import { PayBooking } from "@/features/booking/components/pay-booking";

export const metadata: Metadata = { title: content.booking.pay.title };

/** The link we email once staff approve the customer's documents. */
export default async function PayPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <PayBooking reference={reference} />;
}
