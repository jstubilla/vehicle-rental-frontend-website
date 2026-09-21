import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: content.admin.login.title };

export default function LoginPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-surface-muted p-gutter">
      {/* The form reads ?next= from the address, which needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
