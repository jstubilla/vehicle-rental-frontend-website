"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listPublishedReviews, listReviews, setReviewPublished } from "@/api/reviews";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { reviewKeys } from "@/features/shared/query-keys";

/** The reviews staff chose to show, for the public website. */
export function usePublishedReviews() {
  return useQuery({ queryKey: reviewKeys.public(), queryFn: listPublishedReviews });
}

/** Every review, for the admin list. */
export function useAdminReviews() {
  return useQuery({ queryKey: reviewKeys.admin(), queryFn: listReviews });
}

/** The show / hide switch. Refreshes both lists so the website matches straight away. */
export function useSetReviewPublished() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = content.admin.reviews;

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => setReviewPublished(id, published),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast({ title: review.published ? t.shownToast : t.hiddenToast, variant: "success" });
    },
    onError: () =>
      toast({ title: content.states.errorTitle, description: content.states.errorDescription, variant: "danger" }),
  });
}
