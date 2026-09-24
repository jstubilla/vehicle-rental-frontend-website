import type { Metadata } from "next";
import { content } from "@/content";
import { BookingShell } from "@/features/booking/components/booking-shell";

// Booking pages are transactional, so they are kept out of search results.
export const metadata: Metadata = {
  title: content.booking.meta.title,
  description: content.booking.meta.description,
  robots: { index: false, follow: false },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <BookingShell>{children}</BookingShell>;
}
