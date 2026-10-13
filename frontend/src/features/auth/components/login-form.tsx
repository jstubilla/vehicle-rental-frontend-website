"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from "@/components/ui";
import { DEMO_PASSWORD } from "@/api/auth";
import { content } from "@/content";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import { useLogin } from "../hooks/use-login";

const t = content.admin.login;

export function LoginForm() {
  const { form, onSubmit, isSubmitting, errorCode, fill } = useLogin();
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <div className="flex w-full max-w-form flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h1" className="text-2xl">
            {t.title}
          </CardTitle>
          <p className="text-muted">{t.description}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {errorCode && (
              <Alert variant="danger">{t.errors[errorCode]}</Alert>
            )}
            <FormField label={t.email} required error={errors.email?.message}>
              <Input {...register("email")} type="email" autoComplete="username" />
            </FormField>
            <FormField label={t.password} required error={errors.password?.message}>
              <Input {...register("password")} type="password" autoComplete="current-password" />
            </FormField>
            <Button type="submit" size="lg" loading={isSubmitting}>
              {isSubmitting ? t.submitting : t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      {SHOW_MOCK_CONTROLS && (
        <Card variant="muted" as="section" aria-labelledby="demo-accounts-heading">
          <CardContent className="flex flex-col gap-3 pt-4 md:pt-6">
            <h2 id="demo-accounts-heading" className="text-lg">
              {t.demo.title}
            </h2>
            <p className="text-sm text-muted">
              {t.demo.description} <code className="font-mono font-semibold">{DEMO_PASSWORD}</code>
            </p>
            <ul className="flex flex-col gap-2">
              {t.demo.accounts.map((account) => (
                <li key={account.email} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-medium">{account.name}</span>
                    <span className="block text-muted">{account.email}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => fill(account.email, DEMO_PASSWORD)}>
                    {t.demo.use}
                    <span className="sr-only"> ({account.name})</span>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="link" className="self-center">
        <Link href="/">{t.backToSite}</Link>
      </Button>
    </div>
  );
}
