"use client";

import Link from "next/link";
import { Button, Card, CardContent, EmptyState, ErrorState, Section, Skeleton, StarRating } from "@/components/ui";
import { content } from "@/content";
import { formatDate } from "@/lib/dates";
import { usePublishedReviews } from "../hooks/use-reviews";

const t = content.home.reviews;

/** Home page section: only the reviews staff chose to show. */
export function PublicReviews() {
  const { data, isError, refetch } = usePublishedReviews();

  return (
    <Section aria-labelledby="reviews-heading">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 id="reviews-heading">{t.title}</h2>
          <p className="text-muted">{t.description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/review">{t.write}</Link>
        </Button>
      </div>

      {isError && !data ? (
        <ErrorState title={t.errorTitle} onRetry={() => refetch()} />
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {data.map((review) => (
            <li key={review.id}>
              <Card as="figure" className="h-full">
                <CardContent className="flex h-full flex-col gap-3 pt-4 md:pt-6">
                  <StarRating value={review.rating} />
                  <blockquote className="flex-1">{review.comment}</blockquote>
                  <figcaption>
                    <p className="font-medium">{review.name}</p>
                    <p className="text-sm text-muted">{formatDate(review.createdAt)}</p>
                  </figcaption>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
