"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActivity, listActivities, listRecentActivities, type ActivityInput } from "@/api/activities";
import { content } from "@/content";
import { useToast } from "@/components/ui";
import type { Activity } from "@/types";

export const activityKeys = {
  all: ["activities"] as const,
  entity: (type: Activity["entityType"], id: string) => [...activityKeys.all, type, id] as const,
  recent: () => [...activityKeys.all, "recent"] as const,
};

export function useActivities(entityType: Activity["entityType"], entityId: string) {
  return useQuery({
    queryKey: activityKeys.entity(entityType, entityId),
    queryFn: () => listActivities(entityType, entityId),
  });
}

export function useRecentActivities(limit = 8) {
  return useQuery({ queryKey: [...activityKeys.recent(), limit], queryFn: () => listRecentActivities(limit) });
}

/** Adds a note or call to a lead's or customer's log. */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast({ title: content.admin.activities.added, variant: "success" });
    },
  });
}
