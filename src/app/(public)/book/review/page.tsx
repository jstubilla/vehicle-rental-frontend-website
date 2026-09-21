import type { Metadata } from "next";
import { content } from "@/content";
import { ReviewStep } from "@/features/booking/components/review-step";

export const metadata: Metadata = { title: content.booking.steps.review };

export default function ReviewPage() {
  return <ReviewStep />;
}
