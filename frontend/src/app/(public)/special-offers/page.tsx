import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Card, PageHeader, Price, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.specialOffers;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/special-offers" });

/**
 * Tours & Transfers (kept at /special-offers so old links work). Static copy and fixed prices from
 * content.specialOffers: nothing here is wired into the booking price, and asking is done by contacting us.
 *
 * Built to be scanned, with no rules at all:
 * - The two price lists are two quiet panels, side by side on wide screens so all eight prices are in view
 *   at once, stacked on phones. Rows are separated by space, not rules; each price sits in one right-hand column.
 * - The ask closes the page in the site's standard banner (as on Home and About).
 */
export default function SpecialOffersPage() {
  return (
    <>
      <Section>
        <div className="flex flex-col gap-10 md:gap-12">
          <PageHeader title={t.title} description={t.subtitle} display />

          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {t.priceLists.map((list) => (
              <Card
                key={list.id}
                as="section"
                id={list.id}
                variant="muted"
                aria-labelledby={`${list.id}-heading`}
                className="scroll-mt-28 gap-6 p-5 md:p-8"
              >
                <div className="flex flex-col gap-1">
                  <h2 id={`${list.id}-heading`} className="text-2xl font-extrabold tracking-display md:text-3xl">
                    {list.title}
                  </h2>
                  <p className="text-lg font-medium text-muted">{list.capacity}</p>
                </div>
                <ul className="flex flex-col gap-5">
                  {list.items.map((item) => (
                    <li key={item.name} className="flex items-center justify-between gap-4">
                      <span className="min-w-0 text-lg font-medium">{item.name}</span>
                      {/* No unit here, so no gap for one: the peso amount and the USD line both end on the right edge. */}
                      <Price amount={item.price} className="shrink-0 gap-x-0 text-right" />
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />
    </>
  );
}
