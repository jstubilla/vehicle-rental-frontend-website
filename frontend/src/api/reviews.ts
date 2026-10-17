import type { PublicReview, Review } from "@/types";
import { requireStaff } from "./auth";
import { check, unwrap } from "./client";
import { toReview, type ReviewRow } from "./rows";
import { db, isSupabaseConfigured } from "./supabase";

export interface ReviewInput {
  name: string;
  rating: number;
  comment: string;
  bookingReference: string;
}

/**
 * Saves a customer's review. It stays private until staff choose to show it. The database checks that
 * the booking reference belongs to a real booking ("unknown_booking" otherwise).
 */
export async function submitReview(input: ReviewInput): Promise<void> {
  check(
    await db().rpc("submit_review", {
      name: input.name,
      rating: input.rating,
      comment: input.comment,
      booking_reference: input.bookingReference,
    }),
  );
}

/**
 * The reviews staff chose to show, newest first. Nothing private (like the booking reference) is included.
 * Without a Supabase connection there are none, so the home page shows its "no reviews yet" message.
 */
export async function listPublishedReviews(): Promise<PublicReview[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = unwrap(await db().rpc("list_published_reviews")) as Pick<ReviewRow, "id" | "name" | "rating" | "comment" | "created_at">[];
  return rows.map(({ id, name, rating, comment, created_at }) => ({ id, name, rating, comment, createdAt: created_at }));
}

/** Staff only: every review, shown or not. */
export async function listReviews(): Promise<Review[]> {
  await requireStaff();
  const rows = unwrap(await db().from("reviews").select("*").order("created_at", { ascending: false }));
  return (rows as ReviewRow[]).map(toReview);
}

/** Staff only: show or hide one review on the public website. */
export async function setReviewPublished(id: string, published: boolean): Promise<Review> {
  await requireStaff();
  const row = unwrap(await db().from("reviews").update({ published }).eq("id", id).select("*").single());
  return toReview(row as ReviewRow);
}
