"use client";

import Link from "next/link";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from "@/components/ui";
import { content } from "@/content";
import { useLogin } from "../hooks/use-login";

const t = content.admin.login;

export function LoginForm() {
  const { form, onSubmit, isSubmitting, errorCode } = useLogin();
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

      <Button asChild variant="link" className="self-center">
        <Link href="/">{t.backToSite}</Link>
      </Button>
    </div>
  );
}
