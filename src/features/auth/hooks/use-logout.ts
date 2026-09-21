"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/auth";

/** Signs out, forgets everything loaded for the admin area, and goes to the login page. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/admin/login");
    },
  });

  return { logout: () => mutation.mutate(), isLoggingOut: mutation.isPending || mutation.isSuccess };
}
