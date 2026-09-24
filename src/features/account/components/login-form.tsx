"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  AppleIcon,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  GoogleIcon,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { content } from "@/content";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";
import { useCodeLogin, usePasswordLogin, useProviderLogin } from "../hooks/use-login";

const t = content.account.login;

/** Customer login: Google, Apple, email and password, or an email code. */
export function LoginForm() {
  const [tab, setTab] = useState("password");
  const password = usePasswordLogin();
  const code = useCodeLogin();
  const provider = useProviderLogin();

  return (
    <div className="flex w-full max-w-form flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle as="h1" className="text-2xl">
            {t.title}
          </CardTitle>
          <p className="text-muted">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {provider.errorCode && <Alert variant="danger">{t.errors[provider.errorCode]}</Alert>}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="lg"
              disabled={provider.isBusy}
              loading={provider.busyProvider === "google"}
              onClick={() => provider.login("google")}
            >
              <GoogleIcon />
              {t.google}
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={provider.isBusy}
              loading={provider.busyProvider === "apple"}
              onClick={() => provider.login("apple")}
            >
              <AppleIcon />
              {t.apple}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            {t.or}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label={t.methodsLabel}>
              <TabsTrigger value="password">{t.tabPassword}</TabsTrigger>
              <TabsTrigger value="code">{t.tabCode}</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={password.onSubmit} noValidate className="flex flex-col gap-4">
                {password.errorCode && <Alert variant="danger">{t.errors[password.errorCode]}</Alert>}
                <FormField label={t.email} required error={password.form.formState.errors.email?.message}>
                  <Input {...password.form.register("email")} type="email" autoComplete="username" />
                </FormField>
                <FormField label={t.password} required error={password.form.formState.errors.password?.message}>
                  <Input {...password.form.register("password")} type="password" autoComplete="current-password" />
                </FormField>
                <Button type="submit" size="lg" loading={password.isSubmitting}>
                  {password.isSubmitting ? t.submitting : t.submit}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="code">
              {code.sentTo === null ? (
                <form onSubmit={code.onSendCode} noValidate className="flex flex-col gap-4">
                  {code.errorCode && <Alert variant="danger">{t.errors[code.errorCode]}</Alert>}
                  <FormField label={t.email} required error={code.emailForm.formState.errors.email?.message}>
                    <Input {...code.emailForm.register("email")} type="email" autoComplete="email" />
                  </FormField>
                  <Button type="submit" size="lg" loading={code.isSending}>
                    {code.isSending ? t.sendingCode : t.sendCode}
                  </Button>
                </form>
              ) : (
                <form onSubmit={code.onVerify} noValidate className="flex flex-col gap-4">
                  <p role="status">{t.codeSent(code.sentTo)}</p>
                  {code.errorCode && <Alert variant="danger">{t.errors[code.errorCode]}</Alert>}
                  <FormField
                    label={t.code}
                    required
                    hint={SHOW_MOCK_CONTROLS ? t.codeDemoNote : undefined}
                    error={code.codeForm.formState.errors.code?.message}
                  >
                    <Input
                      {...code.codeForm.register("code")}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                    />
                  </FormField>
                  <Button type="submit" size="lg" loading={code.isVerifying}>
                    {code.isVerifying ? t.submitting : t.verify}
                  </Button>
                  <Button type="button" variant="link" className="self-start" onClick={code.changeEmail}>
                    {t.changeEmail}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-sm">
            {t.noAccountYet} <Link href="/signup" className="underline underline-offset-4">{t.signupLink}</Link>
          </p>
        </CardContent>
      </Card>

      {SHOW_MOCK_CONTROLS && (
        <Card variant="muted" as="section" aria-labelledby="demo-customer-heading">
          <CardContent className="flex flex-col gap-3 pt-4 md:pt-6">
            <h2 id="demo-customer-heading" className="text-lg">
              {t.demo.title}
            </h2>
            <p className="text-sm text-muted">{t.demo.description}</p>
            <p className="text-sm">
              <span className="block font-medium">{t.demo.email}</span>
              <code className="font-mono text-muted">{t.demo.password}</code>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                setTab("password");
                password.fill(t.demo.email, t.demo.password);
              }}
            >
              {t.demo.use}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
