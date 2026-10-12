import type { Metadata } from "next";
import { Section } from "@/components/ui";
import { content } from "@/content";
import { MyBookings } from "@/features/account/components/my-bookings";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({ ...content.account.bookings.meta, path: "/my-bookings" }),
  robots: { index: false },
};

export default function MyBookingsPage() {
  return (
    <Section>
      <MyBookings />
    </Section>
  );
}
