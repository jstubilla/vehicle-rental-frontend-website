import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonArrow, Card, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.specialOffers;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/special-offers" });

/**
 * Static marketing copy only: nothing here is wired into the booking price.
 *
 * Wide screens: the title and the one way to act on the offers (ask us) hold the left column while the
 * offers run down the right as a ruled ledger. Phones: title, offers, then the ask, so it still comes last.
 */
export default function SpecialOffersPage() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="contents lg:sticky lg:top-28 lg:col-span-5 lg:flex lg:flex-col lg:gap-12 lg:self-start">
          <PageHeader title={t.title} description={t.subtitle} display />

          <Card
            as="section"
            variant="raised"
            aria-labelledby="offers-cta-heading"
            className="order-last gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6 lg:order-none lg:flex-col lg:items-start"
          >
            <h2 id="offers-cta-heading">{t.cta.title}</h2>
            <Button asChild size="lg" variant="accent" className="self-start sm:self-auto lg:self-start">
              <Link href="/contact">
                {t.cta.button}
                <ButtonArrow />
              </Link>
            </Button>
          </Card>
        </div>

        <section aria-labelledby="offers-heading" className="lg:col-span-7">
          <h2 id="offers-heading" className="sr-only">
            {t.title}
          </h2>
          <ul className="ledger border-b border-border">
            {t.offers.map((offer) => (
              <li key={offer.title} className="flex flex-col gap-3 py-8 md:py-10">
                <h3 className="text-2xl font-extrabold tracking-display md:text-3xl">{offer.title}</h3>
                <p className="max-w-prose text-lg text-muted">{offer.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Section>
  );
}
