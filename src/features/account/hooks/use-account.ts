"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentAccount, logout } from "@/api/account";

export const accountKey = ["account"] as const;

/** The signed-in customer, or null. `isSuccess` is false until the browser has checked. */
export function useAccount() {
  return useQuery({ queryKey: accountKey, queryFn: getCurrentAccount, staleTime: Infinity });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(accountKey, null),
  });
}
