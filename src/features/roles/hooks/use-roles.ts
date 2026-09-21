"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { createRole, deleteRole, listRoleRows, updateRole, type RoleInput } from "@/api/roles";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { userKeys } from "@/features/users/hooks/use-users";

const t = content.admin.roles;

export function useRoleRows() {
  return useQuery({ queryKey: ["roles", "rows"], queryFn: listRoleRows });
}

/** The message for a failed role change, in plain words. */
export function roleErrorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : "unknown";
  return code in t.errors ? t.errors[code as keyof typeof t.errors] : t.errors.unknown;
}

/** Create, edit and delete roles. */
export function useRoleMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  return {
    create: useMutation({
      mutationFn: (input: RoleInput) => createRole(input),
      onSuccess: () => {
        refresh();
        toast({ title: t.added, variant: "success" });
      },
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: RoleInput }) => updateRole(id, input),
      onSuccess: () => {
        refresh();
        toast({ title: t.saved, variant: "success" });
      },
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteRole(id),
      onSuccess: () => {
        refresh();
        toast({ title: t.deleted, variant: "success" });
      },
      onError: (error) => toast({ title: roleErrorMessage(error), variant: "danger" }),
    }),
  };
}
