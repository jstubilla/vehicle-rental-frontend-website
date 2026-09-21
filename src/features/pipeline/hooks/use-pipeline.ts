"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeLeadStage, listPipelineLeads } from "@/api/leads";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { activityKeys } from "@/features/activities/hooks/use-activities";
import { leadKeys } from "@/features/shared/query-keys";
import type { LeadStage } from "@/lib/constants";
import type { LeadRow } from "@/lib/lead-search";

/** All leads for the board, and a "move to another stage" action that updates the board instantly. */
export function usePipeline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: leadKeys.board(), queryFn: listPipelineLeads });

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage; name: string }) => changeLeadStage(id, stage),
    // Show the card in its new column straight away; put it back if saving fails.
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.board() });
      const previous = queryClient.getQueryData<LeadRow[]>(leadKeys.board());
      queryClient.setQueryData<LeadRow[]>(leadKeys.board(), (rows) =>
        rows?.map((row) => (row.id === id ? { ...row, stage } : row)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(leadKeys.board(), context.previous);
      toast({ title: content.admin.pipeline.moveFailed, variant: "danger" });
    },
    onSuccess: (_lead, { name, stage }) => {
      toast({ title: content.admin.pipeline.moved(name, content.enums.leadStage[stage]), variant: "success" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { leads: query.data, isError: query.isError, refetch: query.refetch, move };
}
