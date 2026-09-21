"use client";

import { ErrorState, Section } from "@/components/ui";

/** Catches unexpected errors in any route so visitors see a friendly message. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content">
      <Section size="narrow">
        <ErrorState onRetry={reset} />
      </Section>
    </main>
  );
}
