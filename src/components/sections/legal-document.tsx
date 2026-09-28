import { Alert, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";

export interface LegalDocumentProps {
  title: string;
  subtitle?: string;
  sections: readonly { title: string; body: readonly string[] }[];
}

/** A legal page: title, the "placeholder" notice, then each section as a heading and short paragraphs. */
export function LegalDocument({ title, subtitle, sections }: LegalDocumentProps) {
  return (
    <>
      <Section className="pb-0">
        <PageHeader title={title} description={subtitle} />
        <Alert variant="warning" title={content.legal.notice} className="mt-6 max-w-narrow" />
      </Section>

      <Section>
        <div className="flex max-w-narrow flex-col gap-8">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`legal-section-${index}`} className="flex flex-col gap-2">
              <h2 id={`legal-section-${index}`} className="text-2xl">
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
      </Section>
    </>
  );
}
