import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Section>
          <div className="flex flex-col items-start gap-8">
            <PageHeader display title={content.states.notFoundTitle} description={content.states.notFoundDescription} />
            <Button asChild variant="outline" size="lg">
              <Link href="/">{content.states.backHome}</Link>
            </Button>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
