"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { signUp } from "@/api/account";
import { ApiError } from "@/api/client";
import type { content } from "@/content";
import { signupSchema, type SignupValues } from "../schemas";
import { useAfterLogin } from "./use-login";

/** Logic for the create-account form. A new account is signed in straight away. */
export function useSignup() {
  const afterLogin = useAfterLogin();
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const mutation = useMutation({ mutationFn: (values: SignupValues) => signUp(values), onSuccess: afterLogin });

  const error = mutation.error;
  const errorCode: keyof typeof content.account.signup.errors | null = !error
    ? null
    : error instanceof ApiError && error.code === "duplicate_email"
      ? "duplicate_email"
      : "unknown";

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isSubmitting: mutation.isPending || mutation.isSuccess,
    errorCode,
  };
}
