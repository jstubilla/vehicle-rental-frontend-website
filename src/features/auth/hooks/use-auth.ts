"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/api/auth";
import type { Permission } from "@/lib/constants";
import { sessionCan } from "@/lib/session";

export const sessionKey = ["session"] as const;

/** Who is signed in and what they may do. Use `can("leads.edit")` to show or hide things. */
export function useAuth() {
  const query = useQuery({ queryKey: sessionKey, queryFn: getSession, staleTime: 60_000 });
  const session = query.data ?? null;

  return {
    session,
    isLoading: query.isPending,
    can: (permission: Permission) => sessionCan(session, permission),
  };
}
