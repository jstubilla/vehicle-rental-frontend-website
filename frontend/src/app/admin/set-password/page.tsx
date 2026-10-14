import type { Metadata } from "next";
import { content } from "@/content";
import { SetPasswordForm } from "@/features/auth/components/set-password-form";

export const metadata: Metadata = { title: content.admin.setPassword.title };

export default function SetPasswordPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-background p-gutter">
      <SetPasswordForm />
    </main>
  );
}
