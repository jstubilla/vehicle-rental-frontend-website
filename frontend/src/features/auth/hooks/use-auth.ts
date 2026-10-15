"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/api/auth";

export const sessionKey = ["session"] as const;

/** Who is signed in. Everyone who is signed in is an admin. */
export function useAuth() {
  const query = useQuery({ queryKey: sessionKey, queryFn: getSession, staleTime: 60_000 });
  return { session: query.data ?? null, isLoading: query.isPending };
}
