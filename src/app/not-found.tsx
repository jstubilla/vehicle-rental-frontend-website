import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, EmptyState, Section } from "@/components/ui";
import { content } from "@/content";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Section size="narrow">
          <EmptyState
            headingAs="h1"
            title={content.states.notFoundTitle}
            description={content.states.notFoundDescription}
            action={
              <Button asChild>
                <Link href="/">{content.states.backHome}</Link>
              </Button>
            }
          />
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
