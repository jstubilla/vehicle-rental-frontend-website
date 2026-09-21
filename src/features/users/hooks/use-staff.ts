"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { createUser, listRoles, listStaff, setUserActive, updateUser, type UserInput } from "@/api/users";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { userKeys } from "./use-users";

const t = content.admin.users;

export const staffKey = [...userKeys.all, "staff"] as const;

/** Staff accounts with their role names (Users screen). */
export function useStaff() {
  return useQuery({ queryKey: staffKey, queryFn: listStaff });
}

/** Roles for the "role" picker. */
export function useRoleOptions() {
  return useQuery({ queryKey: ["roles", "options"], queryFn: listRoles });
}

/** The message for a failed staff change, in plain words. */
export function userErrorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : "unknown";
  return code in t.errors ? t.errors[code as keyof typeof t.errors] : t.errors.unknown;
}

/** Add, edit, and turn accounts on or off. */
export function useUserMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  return {
    create: useMutation({
      mutationFn: (input: UserInput) => createUser(input),
      onSuccess: () => {
        refresh();
        toast({ title: t.added, variant: "success" });
      },
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UserInput }) => updateUser(id, input),
      onSuccess: () => {
        refresh();
        toast({ title: t.saved, variant: "success" });
      },
    }),
    setActive: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
      onSuccess: (_user, { active }) => {
        refresh();
        toast({ title: active ? t.reactivated : t.deactivated, variant: "success" });
      },
      onError: (error) => toast({ title: userErrorMessage(error), variant: "danger" }),
    }),
  };
}
