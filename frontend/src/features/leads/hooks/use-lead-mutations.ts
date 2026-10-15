"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeLeadStage, convertLeadToCustomer, createLead, deleteLead, updateLead, type LeadInput } from "@/api/leads";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { activityKeys } from "@/features/activities/hooks/use-activities";
import { customerKeys, leadKeys } from "@/features/shared/query-keys";
import type { LeadStage } from "@/lib/constants";

const t = content.admin.leads;

/** Create, edit, move between stages, convert and delete leads. */
export function useLeadMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: leadKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    create: useMutation({
      mutationFn: (input: LeadInput) => createLead(input),
      onSuccess: () => {
        refresh();
        toast({ title: t.added, variant: "success" });
      },
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Omit<LeadInput, "stage"> }) => updateLead(id, input),
      onSuccess: () => {
        refresh();
        toast({ title: t.saved, variant: "success" });
      },
    }),
    changeStage: useMutation({
      mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) => changeLeadStage(id, stage),
      onSuccess: () => {
        refresh();
        toast({ title: t.detail.stageChanged, variant: "success" });
      },
    }),
    convert: useMutation({
      mutationFn: (id: string) => convertLeadToCustomer(id),
      onSuccess: () => {
        refresh();
        queryClient.invalidateQueries({ queryKey: customerKeys.all });
        toast({ title: t.detail.converted, variant: "success" });
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteLead(id),
      onSuccess: () => {
        refresh();
        toast({ title: t.deleted, variant: "success" });
      },
    }),
  };
}
