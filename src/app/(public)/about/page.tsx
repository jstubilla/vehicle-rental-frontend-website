import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Card, CardContent, CardHeader, CardTitle, Media, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.about;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/about" });

export default function AboutPage() {
  return (
    <>
      <Section className="pb-0">
        <PageHeader title={t.title} description={t.subtitle} />
      </Section>

      <Section aria-labelledby="story-heading">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 id="story-heading">{t.story.title}</h2>
            {t.story.body.map((paragraph) => (
              <p key={paragraph} className="text-muted">
                {paragraph}
              </p>
            ))}
          </div>
          <Media asset="about" sizes="(min-width: 64rem) 50vw, 100vw" />
        </div>
      </Section>

      <Section variant="muted" aria-labelledby="values-heading">
        <h2 id="values-heading" className="mb-6">
          {t.values.title}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {t.values.items.map((item) => (
            <li key={item.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle as="h3">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted">{item.body}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="team-heading">
        <h2 id="team-heading" className="mb-6">
          {t.team.title}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {t.team.members.map((member, index) => (
            <li key={index} className="flex flex-col gap-3">
              <Media asset="team" sizes="(min-width: 48rem) 33vw, 100vw" />
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />
    </>
  );
}
