import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { BookingList } from "@/features/bookings/components/booking-list";

export const metadata: Metadata = { title: content.admin.bookings.title };

export default function BookingsPage() {
  // The list keeps its search, filter and page in the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <BookingList />
    </Suspense>
  );
}
