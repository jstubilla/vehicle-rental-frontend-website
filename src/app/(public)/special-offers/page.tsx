import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.specialOffers;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/special-offers" });

/** Static marketing copy only: nothing here is wired into the booking price. */
export default function SpecialOffersPage() {
  return (
    <>
      <Section className="pb-0">
        <PageHeader title={t.title} description={t.subtitle} />
      </Section>

      <Section aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="sr-only">
          {t.title}
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {t.offers.map((offer) => (
            <li key={offer.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle as="h3">{offer.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted">{offer.body}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />
    </>
  );
}
