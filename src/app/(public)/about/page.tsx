import type { Metadata } from "next";
import { teamPhotos } from "@/assets/config";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Band, Media, Reveal, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.about;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/about" });

/**
 * The display title heads the story, the heart of the page: its opening line set large beside the rest.
 * The team follows straight after, so the founders the story names appear next; the values sit apart in the
 * page's one tinted band, and the page closes on the usual ask.
 */
export default function AboutPage() {
  const [storyLead, ...storyRest] = t.story.body;

  return (
    <>
      {/* The story's opening line is its heading, held beside the paragraphs on wide screens while they scroll past. */}
      <Section>
        <div className="flex flex-col gap-10 lg:gap-16">
          <h1 className="text-display">{t.title}</h1>
          <section aria-labelledby="story-heading" className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2
              id="story-heading"
              className="text-balance font-heading text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:sticky lg:top-28 lg:col-span-5 lg:self-start"
            >
              <span className="sr-only">{t.story.title}: </span>
              {storyLead}
            </h2>
            <div className="flex flex-col gap-6 lg:col-span-7">
              {storyRest.map((paragraph) => (
                <p key={paragraph} className="max-w-prose text-lg text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </div>
      </Section>

      <Section aria-labelledby="team-heading">
        <div className="flex flex-col gap-8 md:gap-10">
          <h2 id="team-heading">{t.team.title}</h2>
          {/* Phones: compact rows (photo beside the name). From sm: three photos that settle in turn. */}
          <Reveal as="ul" className="grid gap-y-6 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-10">
            {t.team.members.map((member, index) => (
              <li
                key={index}
                data-reveal-item=""
                className="flex items-center gap-4 sm:flex-col sm:items-stretch sm:gap-4"
              >
                <Media
                  asset={teamPhotos[index] ?? "team"}
                  sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 33vw, 6rem"
                  className="w-24 shrink-0 sm:w-auto"
                />
                <div className="flex flex-col gap-0.5 sm:border-t sm:border-border sm:pt-4">
                  <p className="font-heading text-lg font-bold tracking-tight md:text-xl">{member.name}</p>
                  <p className="text-sm text-muted">{member.role}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </div>
      </Section>

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

      <CtaBanner
        title={t.cta.title}
        buttonLabel={t.cta.button}
        href="/contact"
        afterBand
      />
    </>
  );
}
