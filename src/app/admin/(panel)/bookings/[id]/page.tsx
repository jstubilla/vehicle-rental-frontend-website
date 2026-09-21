import type { Metadata } from "next";
import { content } from "@/content";
import { BookingDetail } from "@/features/bookings/components/booking-detail";

export const metadata: Metadata = { title: content.admin.bookings.title };

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} />;
}
