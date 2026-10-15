"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeBookingStatus, markPaymentReceived, reviewBookingDocuments } from "@/api/booking-admin";
import { ApiError } from "@/api/client";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { activityKeys } from "@/features/activities/hooks/use-activities";
import { bookingKeys } from "@/features/shared/query-keys";
import type { BookingStatus } from "@/lib/constants";

const t = content.admin.bookings;

/** Move a booking to its next status, or record that its payment arrived. */
export function useBookingMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    changeStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => changeBookingStatus(id, status),
      onSuccess: () => {
        refresh();
        toast({ title: t.detail.statusChanged, variant: "success" });
      },
      onError: (error) => {
        refresh();
        toast({
          title:
            error instanceof ApiError && error.code === "invalid_transition"
              ? t.detail.invalidMove
              : content.admin.common.saveError,
          variant: "danger",
        });
      },
    }),
    reviewDocuments: useMutation({
      mutationFn: ({ id, decision, reason }: { id: string; decision: "verified" | "rejected"; reason?: string }) =>
        reviewBookingDocuments(id, decision, reason),
      onSuccess: (_, { decision }) => {
        refresh();
        toast({ title: t.detail.documents.saved[decision], variant: decision === "verified" ? "success" : "default" });
      },
      onError: () => {
        refresh();
        toast({ title: content.admin.common.saveError, variant: "danger" });
      },
    }),
    markPaid: useMutation({
      mutationFn: (bookingId: string) => markPaymentReceived(bookingId),
      onSuccess: () => {
        refresh();
        toast({ title: t.detail.paymentReceived, variant: "success" });
      },
    }),
  };
}
