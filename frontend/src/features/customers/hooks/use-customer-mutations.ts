"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer, deleteCustomer, updateCustomer, type CustomerInput } from "@/api/customers";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { activityKeys } from "@/features/activities/hooks/use-activities";
import { customerKeys } from "@/features/shared/query-keys";

const t = content.admin.customers;

/** Create, edit and delete customers. Each shows a notification and refreshes the lists. */
export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: customerKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  };

  const create = useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => {
      refresh();
      toast({ title: t.added, variant: "success" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: () => {
      refresh();
      toast({ title: t.saved, variant: "success" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      refresh();
      toast({ title: t.deleted, variant: "success" });
    },
  });

  return { create, update, remove };
}
