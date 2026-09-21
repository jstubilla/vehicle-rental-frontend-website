import { Section, PageHeader } from "@/components/ui";
import { content } from "@/content";

/** Placeholder. The real home page (hero, quick search, featured vehicles) arrives in Phase 2. */
export default function HomePage() {
  return (
    <Section>
      <PageHeader title={content.home.title} description={content.home.description} />
    </Section>
  );
}
