"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from "@/components/ui";
import { content } from "@/content";
import { useSignup } from "../hooks/use-signup";

const t = content.account.signup;

export function SignupForm() {
  const { form, onSubmit, isSubmitting, errorCode } = useSignup();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <Card className="w-full max-w-form">
      <CardHeader>
        <CardTitle as="h1" className="text-2xl">
          {t.title}
        </CardTitle>
        <p className="text-muted">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {errorCode && <Alert variant="danger">{t.errors[errorCode]}</Alert>}
          <FormField label={t.name} required error={errors.name?.message}>
            <Input {...register("name")} autoComplete="name" />
          </FormField>
          <FormField label={t.email} required error={errors.email?.message}>
            <Input {...register("email")} type="email" autoComplete="email" />
          </FormField>
          <FormField label={t.password} required hint={t.passwordHint} error={errors.password?.message}>
            <Input {...register("password")} type="password" autoComplete="new-password" />
          </FormField>
          <Button type="submit" size="lg" loading={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </form>
        <p className="text-sm">
          {t.haveAccount} <Link href="/login" className="underline underline-offset-4">{t.loginLink}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
