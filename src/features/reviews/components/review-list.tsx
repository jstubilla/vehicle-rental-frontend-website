"use client";

import {
  EmptyState,
  ErrorState,
  Skeleton,
  StarRating,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { content } from "@/content";
import { formatDate } from "@/lib/dates";
import { useAdminReviews, useSetReviewPublished } from "../hooks/use-reviews";

const t = content.admin.reviews;

/** Admin list of every review, each with a show / hide switch for the public website. */
export function ReviewList() {
  const { data, isError, refetch } = useAdminReviews();
  const setPublished = useSetReviewPublished();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="text-lg text-muted">{t.description}</p>
      </div>

      {isError && !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      ) : (
        <Table label={t.title} variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.customer}</TableHead>
              <TableHead>{t.columns.rating}</TableHead>
              <TableHead>{t.columns.comment}</TableHead>
              <TableHead>{t.columns.reference}</TableHead>
              <TableHead>{t.columns.date}</TableHead>
              <TableHead>{t.columns.show}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.name}</TableCell>
                <TableCell>
                  <StarRating value={review.rating} />
                </TableCell>
                <TableCell className="min-w-64 whitespace-normal">{review.comment}</TableCell>
                <TableCell>{review.bookingReference}</TableCell>
                <TableCell>{formatDate(review.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      aria-label={t.showSwitch(review.name)}
                      checked={review.published}
                      disabled={setPublished.isPending}
                      onCheckedChange={(published) => setPublished.mutate({ id: review.id, published })}
                    />
                    <span className="text-sm">{review.published ? t.shown : t.hidden}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
