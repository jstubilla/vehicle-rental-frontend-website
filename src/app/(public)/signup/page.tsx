import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/ui";
import { content } from "@/content";
import { SignupForm } from "@/features/account/components/signup-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({ ...content.account.signup.meta, path: "/signup" }),
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <Section>
      <div className="flex justify-center">
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </Section>
  );
}
