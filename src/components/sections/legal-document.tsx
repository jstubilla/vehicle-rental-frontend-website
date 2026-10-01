import { Alert, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";

export interface LegalDocumentProps {
  title: string;
  subtitle?: string;
  sections: readonly { title: string; body: readonly string[] }[];
}

/**
 * A legal page. Wide screens: the title and the "placeholder" notice stay in view on the left while the
 * sections run down the right as a ledger (rule and tab per section), kept to a readable measure.
 */
export function LegalDocument({ title, subtitle, sections }: LegalDocumentProps) {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <PageHeader title={title} description={subtitle} />
          <Alert variant="warning" title={content.legal.notice} />
        </div>

        <div className="ledger max-w-prose border-b border-border lg:col-span-8">
          {sections.map((section, index) => (
            <section
              key={section.title}
              aria-labelledby={`legal-section-${index}`}
              className="flex flex-col gap-3 py-8"
            >
              <h2 id={`legal-section-${index}`} className="text-xl font-bold tracking-tight">
                {section.title}
              </h2>
              {section.body.map((line) => (
                <p key={line} className="text-muted">
                  {line}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
