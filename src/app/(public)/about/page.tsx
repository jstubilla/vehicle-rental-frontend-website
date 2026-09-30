import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Media, PageHeader, Section, ShieldCheckIcon, SmileIcon, TagIcon } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.about;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/about" });

/** One icon per value, in order (the three values are always this same fixed list). */
const VALUE_ICONS = [ShieldCheckIcon, TagIcon, SmileIcon];

export default function AboutPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
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
        <ul className="max-w-3xl divide-y divide-border border-y border-border">
          {t.values.items.map((item, index) => {
            const ValueIcon = VALUE_ICONS[index];
            return (
              <li key={item.title}>
                <div className="flex items-start gap-5 py-6 md:gap-6 md:py-7">
                  {ValueIcon && (
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center text-primary"
                    >
                      <ValueIcon className="size-6" />
                    </span>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="max-w-2xl text-muted">{item.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
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
