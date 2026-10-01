"use client";

import { ArrowLink, EmptyState, ErrorState, Reveal, Section, Skeleton, StarRating } from "@/components/ui";
import { content } from "@/content";
import { formatDate } from "@/lib/dates";
import type { PublicReview } from "@/types";
import { usePublishedReviews } from "../hooks/use-reviews";

const t = content.home.reviews;

/** Stars, then who and when, on one line: the quote above it carries the weight. */
function Attribution({ review, lead = false }: { review: PublicReview; lead?: boolean }) {
  return (
    <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <StarRating value={review.rating} className={lead ? undefined : "[&_svg]:size-4"} />
      <span>
        <span className="font-semibold text-foreground">{review.name}</span>
        <span className="text-muted"> · {formatDate(review.createdAt)}</span>
      </span>
    </figcaption>
  );
}

/**
 * Home page section: only the reviews staff chose to show. The newest is set large under an oversized
 * opening quote mark; the rest run beside it as a ledger (rule and tab per review, like the rest of the
 * site), starting level with the heading so the two columns balance however many reviews there are.
 * "Write a review" closes the lead column on wide screens and the whole section on phones.
 */
export function PublicReviews() {
  const { data, isError, refetch } = usePublishedReviews();
  const [lead, ...rest] = data ?? [];

  const heading = (
    <div className="flex flex-col gap-1">
      <h2 id="reviews-heading">{t.title}</h2>
      <p className="text-muted">{t.description}</p>
    </div>
  );
  const writeLink = (
    <ArrowLink href="/review" className="self-start">
      {t.write}
    </ArrowLink>
  );

  if (isError && !data) {
    return (
      <Section aria-labelledby="reviews-heading">
        <div className="flex flex-col gap-8">
          {heading}
          <ErrorState title={t.errorTitle} onRetry={() => refetch()} />
        </div>
      </Section>
    );
  }

  if (!data || !lead) {
    return (
      <Section aria-labelledby="reviews-heading">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            {heading}
            {writeLink}
          </div>
          {!data ? (
            <div className="grid gap-8 lg:grid-cols-12" aria-hidden="true">
              <Skeleton className="h-48 lg:col-span-7" />
              <Skeleton className="h-48 lg:col-span-5" />
            </div>
          ) : (
            <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section aria-labelledby="reviews-heading">
      <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-10">
          {heading}

          <figure data-reveal-item="" className="flex flex-col gap-6">
            <blockquote className="flex flex-col">
              <span
                aria-hidden="true"
                className="-mb-4 -ml-2 h-16 font-heading text-8xl leading-none font-extrabold text-primary select-none md:-mb-2"
              >
                &ldquo;
              </span>
              <p className="font-heading text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl lg:leading-tight">
                {lead.comment}
              </p>
            </blockquote>
            <Attribution review={lead} lead />
          </figure>

          <div className="order-last lg:order-none lg:mt-auto">{writeLink}</div>
        </div>

        {rest.length > 0 && (
          <ul data-reveal-item="" className="ledger self-start border-b border-border lg:col-span-5">
            {rest.map((review) => (
              <li key={review.id} className="py-6">
                <figure className="flex flex-col gap-3">
                  <blockquote>
                    <p className="text-lg text-foreground">{review.comment}</p>
                  </blockquote>
                  <Attribution review={review} />
                </figure>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </Section>
  );
}
