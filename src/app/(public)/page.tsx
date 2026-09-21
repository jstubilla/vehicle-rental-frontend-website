import type { Metadata } from "next";
import Link from "next/link";
import { listLocations } from "@/api/locations";
import { listFeaturedVehicles } from "@/api/vehicles";
import { CtaBanner } from "@/components/sections/cta-banner";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Testimonials } from "@/components/sections/testimonials";
import { Button, Media, Section } from "@/components/ui";
import { content } from "@/content";
import { FeaturedVehicles } from "@/features/vehicles/components/featured-vehicles";
import { QuickSearch } from "@/features/search/quick-search";

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
  const [locations, featured] = await Promise.all([listLocations(), listFeaturedVehicles()]);

  return (
    <>
      <Section className="pb-0">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h1>{t.hero.title}</h1>
            <p className="text-lg text-muted">{t.hero.subtitle}</p>
          </div>
          <Media asset="hero" priority sizes="(min-width: 64rem) 50vw, 100vw" />
        </div>
      </Section>

      <Section id="search" className="scroll-mt-24">
        <QuickSearch locations={locations} />
      </Section>

      <Section variant="muted" aria-labelledby="featured-heading">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="featured-heading">{t.featured.title}</h2>
            <p className="text-muted">{t.featured.description}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/vehicles">{t.featured.viewAll}</Link>
          </Button>
        </div>
        <FeaturedVehicles initialData={featured} />
      </Section>

      <HowItWorks title={t.howItWorks.title} steps={t.howItWorks.steps} />
      <Testimonials
        title={t.testimonials.title}
        description={t.testimonials.description}
        items={t.testimonials.items}
      />
      <CtaBanner
        title={t.cta.title}
        description={t.cta.description}
        buttonLabel={t.cta.button}
        href={content.nav.bookCta.href}
      />
    </>
  );
}
