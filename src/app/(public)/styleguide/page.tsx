import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui";
import { StyleguideSections } from "@/features/styleguide/styleguide-sections";

export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false, follow: false },
};

/** Dev-only page listing every UI kit component. Hidden from search engines. */
export default function StyleguidePage() {
  return (
    <>
      <Container className="py-8">
        <PageHeader title="UI kit" description="Every reusable component, in one place." />
      </Container>
      <StyleguideSections />
    </>
  );
}
