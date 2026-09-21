import type { Metadata } from "next";
import { content } from "@/content";
import { DetailsStep } from "@/features/booking/components/details-step";

export const metadata: Metadata = { title: content.booking.steps.details };

export default function DetailsPage() {
  return <DetailsStep />;
}
