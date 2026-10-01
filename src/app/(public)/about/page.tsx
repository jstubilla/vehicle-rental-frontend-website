import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import { EditorialSection } from "@/components/sections/editorial-section";
import { Band, Media, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.about;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/about" });

/**
 * Opens like the home page (display title beside the photo), reads as an editorial page, and sets the
 * values apart in the site's one tinted band before the team and the closing ask.
 */
export default function AboutPage() {
  return (
    <>
      <Section>
        <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
          <PageHeader display title={t.title} description={t.subtitle} className="lg:col-span-7 lg:pb-12" />
          <Media
            asset="about"
            priority
            sizes="(min-width: 64rem) 40vw, 100vw"
            className="aspect-wide lg:col-span-5 lg:aspect-photo"
          />
        </div>
      </Section>

      <EditorialSection id="story" title={t.story.title}>
        {t.story.body.map((paragraph) => (
          <p key={paragraph} className="max-w-prose text-lg text-muted">
            {paragraph}
          </p>
        ))}
      </EditorialSection>

      <Band>
        <Section aria-labelledby="values-heading">
          <div className="flex flex-col gap-8 md:gap-10">
            <h2 id="values-heading">{t.values.title}</h2>
            <ul className="ledger grid md:grid-cols-3 md:gap-x-10">
              {t.values.items.map((item) => (
                <li key={item.title} className="flex flex-col gap-2 py-6 md:pb-0">
                  <h3 className="text-xl font-extrabold tracking-display md:text-2xl">{item.title}</h3>
                  <p className="text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </Band>

      <EditorialSection id="team" title={t.team.title} rule={false}>
        <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-3">
          {t.team.members.map((member, index) => (
            // Phones: a compact row (photo beside the name) instead of three full-width photos.
            <li key={index} className="flex items-center gap-4 sm:flex-col sm:items-stretch sm:gap-3">
              <Media
                asset="team"
                sizes="(min-width: 64rem) 20vw, (min-width: 40rem) 33vw, 6rem"
                className="w-24 shrink-0 sm:w-auto"
              />
              <div className="flex flex-col gap-0.5">
                <p className="font-heading text-lg font-bold tracking-tight">{member.name}</p>
                <p className="text-sm text-muted">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </EditorialSection>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />
    </>
  );
}
