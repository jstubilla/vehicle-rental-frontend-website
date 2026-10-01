import type { Metadata } from "next";
import { listFeaturedVehicles } from "@/api/vehicles";
import { CtaBanner } from "@/components/sections/cta-banner";
import { HowItWorks } from "@/components/sections/how-it-works";
import { JsonLd } from "@/components/seo/json-ld";
import { ArrowLink, Band, Container, HeroBackdrop, Section } from "@/components/ui";
import { content } from "@/content";
import { PublicReviews } from "@/features/reviews/components/public-reviews";
import { FeaturedVehicles } from "@/features/vehicles/components/featured-vehicles";
import { QuickSearch } from "@/features/search/quick-search";
import { businessSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: { absolute: content.seo.defaultTitle },
  description: content.home.meta.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: content.site.name,
    locale: content.seo.locale,
    title: content.seo.defaultTitle,
    description: content.home.meta.description,
    url: "/",
  },
};

export default async function HomePage() {
  const t = content.home;
  // Loaded on the server so the page arrives complete for search engines.
  const featured = await listFeaturedVehicles();

  return (
    <>
      <JsonLd data={businessSchema()} />

      {/*
        Hero: the headline and the booking bar are the hero, over a backdrop photo; the search is what people came for,
        so it is the one raised object, full width, hanging over into the band below so the hero hands off
        to the vehicles instead of just ending. Wide screens set the subtitle opposite the headline's last line.
      */}
      <section
        id="search"
        className="relative scroll-mt-24 pt-10 md:pt-16 lg:pt-20"
        aria-labelledby="hero-heading"
      >
        {/* A photo from the very top of the page, washed behind the headline and faded into the page. */}
        {/*
          It runs on behind the booking bar and fades out just past its foot, inside the band's clear top.
          Stacking (no isolate here on purpose): photo at the back, then the band's rising tint, then the
          booking bar (z-10), so the tint never washes over the bar where the two overlap.
        */}
        <HeroBackdrop asset="backdrop" className="-bottom-24 md:-bottom-28" />
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-baseline-last lg:gap-12">
            <h1 id="hero-heading" className="text-display lg:col-span-7">
              {t.hero.title}
            </h1>
            {/*
              Wide screens: the subtitle's last line sits exactly on the headline's last baseline (grid
              last-baseline alignment), under a ledger rule that runs out to the booking bar's right edge.
              The price promise is set in full text color; how you book follows, muted.
            */}
            <div className="ledger lg:col-span-5 lg:justify-self-end lg:w-full lg:max-w-sm">
              <p className="pt-4 text-lg lg:pt-5 lg:text-xl">
                <span className="block font-heading font-semibold tracking-tight text-foreground">{t.hero.subtitle.lead}</span>
                <span className="block text-foreground/85 dark:text-muted">{t.hero.subtitle.rest}</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 mt-8 -mb-16 md:mt-10 md:-mb-20 lg:mt-14">
            <QuickSearch />
          </div>
        </Container>
      </section>

      <Band variant="continuous">
        <Section aria-labelledby="featured-heading" className="pt-28 md:pt-36">
          <div className="mb-8 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="flex flex-col gap-1">
              <h2 id="featured-heading">{t.featured.title}</h2>
              <p className="text-muted">{t.featured.description}</p>
            </div>
            <ArrowLink href="/vehicles" className="self-start md:self-auto">
              {t.featured.viewAll}
            </ArrowLink>
          </div>
          <FeaturedVehicles initialData={featured} />
        </Section>

        <HowItWorks title={t.howItWorks.title} steps={t.howItWorks.steps} />
      </Band>

      <PublicReviews />

      <CtaBanner title={t.cta.title} buttonLabel={content.nav.bookCta.label} href={content.nav.bookCta.href} />
    </>
  );
}
