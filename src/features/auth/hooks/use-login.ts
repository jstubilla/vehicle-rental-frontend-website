"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { content } from "@/content";
import { sessionKey } from "./use-auth";

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email(content.validation.email)),
  password: z.string().min(1, content.validation.required),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Only allow going back to a page inside the admin area (never to another site). */
function safeNextPath(next: string | null): string | null {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : null;
}

/** Logic for the staff login form. */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const next = safeNextPath(useSearchParams().get("next"));

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionKey, session);
      router.replace(next ?? "/admin");
    },
  });

  const error = mutation.error;
  const errorCode = error instanceof ApiError ? error.code : error ? "unknown" : null;

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isSubmitting: mutation.isPending || mutation.isSuccess,
    errorCode: errorCode as keyof typeof content.admin.login.errors | null,
    /** Fills the form with a demo account (demo only). */
    fill: (email: string, password: string) => {
      form.setValue("email", email);
      form.setValue("password", password);
    },
  };
}
