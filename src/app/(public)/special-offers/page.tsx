import type { Metadata } from "next";
import { CtaBanner } from "@/components/sections/cta-banner";
import {
  CalendarIcon,
  MapPinIcon,
  PageHeader,
  RouteIcon,
  Section,
  SteeringWheelIcon,
} from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.specialOffers;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/special-offers" });

/** One icon per offer, in order (the four offers are always this same fixed list). */
const OFFER_ICONS = [CalendarIcon, SteeringWheelIcon, MapPinIcon, RouteIcon];

/** Static marketing copy only: nothing here is wired into the booking price. */
export default function SpecialOffersPage() {
  return (
    <>
      <Section className="pb-0 md:pb-0">
        <PageHeader title={t.title} description={t.subtitle} titleClassName="text-4xl md:text-5xl" />
      </Section>

      <Section aria-labelledby="offers-heading">
        <h2 id="offers-heading" className="sr-only">
          {t.title}
        </h2>
        <ul className="max-w-3xl divide-y divide-border border-y border-border">
          {t.offers.map((offer, index) => {
            const OfferIcon = OFFER_ICONS[index];
            return (
              <li key={offer.title}>
                <div className="flex items-start gap-5 py-6 md:gap-6 md:py-7">
                  {OfferIcon && (
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center text-primary"
                    >
                      <OfferIcon className="size-6" />
                    </span>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xl font-semibold">{offer.title}</h3>
                    <p className="max-w-2xl text-muted">{offer.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />
    </>
  );
}
