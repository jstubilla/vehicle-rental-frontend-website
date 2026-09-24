import type { Metadata } from "next";
import { content } from "@/content";
import { ReviewList } from "@/features/reviews/components/review-list";

export const metadata: Metadata = { title: content.admin.reviews.title };

export default function ReviewsPage() {
  return <ReviewList />;
}
