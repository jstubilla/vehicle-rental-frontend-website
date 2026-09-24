import { newId, readTable, writeTable } from "@/mocks/store";
import type { PublicReview, Review } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

export interface ReviewInput {
  name: string;
  rating: number;
  comment: string;
  bookingReference: string;
}

const byNewest = (a: Review, b: Review) => b.createdAt.localeCompare(a.createdAt);

/**
 * Saves a customer's review. It stays private until staff choose to show it.
 * The booking reference must belong to a real booking: this is the only check
 * (no spam protection in this skeleton).
 */
export async function submitReview(input: ReviewInput): Promise<void> {
  await simulateNetwork();

  // DEMO ONLY: typing [fail] in the comment shows the form's error state.
  if (input.comment.includes("[fail]")) throw new ApiError("Mock failure requested", 500);

  const reference = input.bookingReference.trim().toUpperCase();
  if (!readTable("bookings").some((booking) => booking.reference === reference)) {
    throw new ApiError("Booking reference not found", 404, "unknown_booking");
  }

  const review: Review = {
    id: newId("rev"),
    name: input.name.trim(),
    rating: input.rating,
    comment: input.comment.trim(),
    bookingReference: reference,
    published: false,
    createdAt: new Date().toISOString(),
  };
  writeTable("reviews", [review, ...readTable("reviews")]);
}

/** The reviews staff chose to show, newest first. Nothing private (like the booking reference) is included. */
export async function listPublishedReviews(): Promise<PublicReview[]> {
  await simulateNetwork();
  return readTable("reviews")
    .filter((review) => review.published)
    .sort(byNewest)
    .map(({ id, name, rating, comment, createdAt }) => ({ id, name, rating, comment, createdAt }));
}

/** Staff only: every review, shown or not. */
export async function listReviews(): Promise<Review[]> {
  assertCan("reviews.manage");
  await simulateNetwork();
  return readTable("reviews").sort(byNewest);
}

/** Staff only: show or hide one review on the public website. */
export async function setReviewPublished(id: string, published: boolean): Promise<Review> {
  assertCan("reviews.manage");
  await simulateNetwork();
  const reviews = readTable("reviews");
  const review = reviews.find((r) => r.id === id);
  if (!review) throw new ApiError("Review not found", 404, "not_found");
  const updated = { ...review, published };
  writeTable("reviews", reviews.map((r) => (r.id === id ? updated : r)));
  return updated;
}
