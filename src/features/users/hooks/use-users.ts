"use client";

import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/api/users";

export const userKeys = { all: ["users"] as const };

/** Staff accounts, for "assigned to" pickers. */
export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: listUsers, staleTime: 60_000 });
}
