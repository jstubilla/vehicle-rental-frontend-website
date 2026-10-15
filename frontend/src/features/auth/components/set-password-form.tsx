"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { setOwnPassword } from "@/api/password";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from "@/components/ui";
import { content } from "@/content";

const t = content.admin.setPassword;

const schema = z.object({ password: z.string().min(8, t.tooShort) });

/** For a new staff member arriving from their invitation email (they are already signed in by the link). */
export function SetPasswordForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "" } });
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => setOwnPassword(values.password),
    onSuccess: () => router.replace("/admin"),
  });

  return (
    <Card className="w-full max-w-form">
      <CardHeader>
        <CardTitle as="h1" className="text-2xl">
          {t.title}
        </CardTitle>
        <p className="text-muted">{t.description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate className="flex flex-col gap-4">
          {mutation.isError && <Alert variant="danger">{t.error}</Alert>}
          <FormField label={t.password} hint={t.hint} required error={form.formState.errors.password?.message}>
            <Input {...form.register("password")} type="password" autoComplete="new-password" />
          </FormField>
          <Button type="submit" size="lg" loading={mutation.isPending || mutation.isSuccess}>
            {mutation.isPending || mutation.isSuccess ? t.submitting : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
