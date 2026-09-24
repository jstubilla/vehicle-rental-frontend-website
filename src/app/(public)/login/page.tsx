import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/ui";
import { content } from "@/content";
import { LoginForm } from "@/features/account/components/login-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({ ...content.account.login.meta, path: "/login" }),
  robots: { index: false },
};

export default function CustomerLoginPage() {
  return (
    <Section>
      {/* The form reads ?next= from the address, which needs a Suspense boundary. */}
      <div className="flex justify-center">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </Section>
  );
}
