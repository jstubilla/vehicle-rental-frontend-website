"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { loginWithCode, loginWithPassword, loginWithProvider, requestLoginCode, type LoginProvider } from "@/api/account";
import { ApiError } from "@/api/client";
import type { content } from "@/content";
import type { AccountProfile } from "@/types";
import {
  codeEmailSchema,
  codeSchema,
  passwordLoginSchema,
  type CodeEmailValues,
  type CodeValues,
  type PasswordLoginValues,
} from "../schemas";
import { accountKey } from "./use-account";

export type LoginErrorCode = keyof typeof content.account.login.errors;

const KNOWN_CODES: string[] = ["invalid_credentials", "invalid_code", "no_account"];

/** Which message to show for a failed request. */
export function loginErrorCode(error: unknown): LoginErrorCode | null {
  if (!error) return null;
  if (error instanceof ApiError && KNOWN_CODES.includes(error.code)) return error.code as LoginErrorCode;
  return "unknown";
}

/** Only allow going back to a page on this site's public side (never to another site or the admin). */
export function safeNextPath(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : null;
}

/** After any successful login or sign-up: remember who it is and go back where the visitor was. */
export function useAfterLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const next = safeNextPath(useSearchParams().get("next"));
  return (account: AccountProfile) => {
    queryClient.setQueryData(accountKey, account);
    router.replace(next ?? "/");
  };
}

/** Log in with email and password. */
export function usePasswordLogin() {
  const afterLogin = useAfterLogin();
  const form = useForm<PasswordLoginValues>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: PasswordLoginValues) => loginWithPassword(values.email, values.password),
    onSuccess: afterLogin,
  });
  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isSubmitting: mutation.isPending || mutation.isSuccess,
    errorCode: loginErrorCode(mutation.error),
    /** Fills the form with the demo customer (demo only). */
    fill: (email: string, password: string) => {
      form.setValue("email", email);
      form.setValue("password", password);
    },
  };
}

/** Log in with a one-time code sent to the email: ask for the code, then enter it. */
export function useCodeLogin() {
  const afterLogin = useAfterLogin();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailForm = useForm<CodeEmailValues>({ resolver: zodResolver(codeEmailSchema), defaultValues: { email: "" } });
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const send = useMutation({
    mutationFn: (values: CodeEmailValues) => requestLoginCode(values.email),
    onSuccess: (_result, values) => setSentTo(values.email.trim()),
  });
  const verify = useMutation({
    mutationFn: (values: CodeValues) => loginWithCode(sentTo ?? "", values.code),
    onSuccess: afterLogin,
  });

  // Move to the code box when it appears, so keyboard and screen reader users land in it.
  useEffect(() => {
    if (sentTo) codeForm.setFocus("code");
  }, [sentTo, codeForm]);

  return {
    sentTo,
    emailForm,
    codeForm,
    onSendCode: emailForm.handleSubmit((values) => send.mutate(values)),
    onVerify: codeForm.handleSubmit((values) => verify.mutate(values)),
    isSending: send.isPending,
    isVerifying: verify.isPending || verify.isSuccess,
    errorCode: loginErrorCode(sentTo ? verify.error : send.error),
    changeEmail: () => {
      setSentTo(null);
      send.reset();
      verify.reset();
      codeForm.reset();
    },
  };
}

/** "Continue with Google / Apple". Demo only: signs in as a fixed demo profile. */
export function useProviderLogin() {
  const afterLogin = useAfterLogin();
  const mutation = useMutation({ mutationFn: (provider: LoginProvider) => loginWithProvider(provider), onSuccess: afterLogin });
  return {
    login: (provider: LoginProvider) => mutation.mutate(provider),
    isBusy: mutation.isPending || mutation.isSuccess,
    busyProvider: mutation.isPending || mutation.isSuccess ? mutation.variables : null,
    errorCode: loginErrorCode(mutation.error),
  };
}
