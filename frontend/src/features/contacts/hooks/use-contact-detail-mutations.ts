"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addContactDetail,
  removeContactDetail,
  updateContactDetail,
  type ContactDetailInput,
  type ContactOwner,
} from "@/api/contact-details";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { customerKeys, leadKeys } from "@/features/shared/query-keys";

/** Add, edit and remove the extra phone numbers and emails of a customer or lead. */
export function useContactDetailMutations(owner: ContactOwner, ownerId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: owner === "customer" ? customerKeys.all : leadKeys.all });
    toast({ title: content.admin.common.saved, variant: "success" });
  };

  return {
    add: useMutation({
      mutationFn: (input: ContactDetailInput) => addContactDetail(owner, ownerId, input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ detailId, input }: { detailId: string; input: ContactDetailInput }) =>
        updateContactDetail(owner, ownerId, detailId, input),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (detailId: string) => removeContactDetail(owner, ownerId, detailId),
      onSuccess,
    }),
  };
}
