import type { Metadata } from "next";
import { listLocations } from "@/api/locations";
import { content } from "@/content";
import { BookingShell } from "@/features/booking/components/booking-shell";

// Booking pages are transactional, so they are kept out of search results.
export const metadata: Metadata = {
  title: content.booking.meta.title,
  description: content.booking.meta.description,
  robots: { index: false, follow: false },
};

export default async function BookLayout({ children }: { children: React.ReactNode }) {
  const locations = await listLocations();
  return <BookingShell locations={locations}>{children}</BookingShell>;
}
