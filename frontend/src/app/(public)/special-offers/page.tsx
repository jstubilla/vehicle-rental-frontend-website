import type { Metadata } from "next";
import Image from "next/image";
import { images, licenseHref, tourPhotos, type ImageAsset } from "@/assets/config";
import { CtaBanner } from "@/components/sections/cta-banner";
import { HeroBackdrop, PageHeader, Price, Section } from "@/components/ui";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.specialOffers;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/special-offers" });

/** Every licensed photo on the page, header first, for the credits at its foot. */
const credited: ImageAsset[] = [
  { ...images.toursBackdrop, label: "Gigantes Island" },
  ...t.priceLists.flatMap((list) => list.items.map((item) => tourPhotos[item.name])),
].filter((photo): photo is ImageAsset => Boolean(photo?.credit));

/**
 * Tours & Transfers (kept at /special-offers so old links work). Static copy and fixed prices from
 * content.specialOffers: nothing here is wired into the booking price, and asking is done by contacting us.
 *
 * Built to be scanned, with no rules at all:
 * - An island photo behind the title says "trips and tours" before a word is read.
 * - The two price lists sit side by side on wide screens so all eight prices are in view at once, stacked on
 *   phones. They are not boxed: each row is already its own tile, over a photo of where it goes, so a panel
 *   around them would only nest boxes. Each price sits in one right-hand column.
 * - The ask closes the page in the site's standard banner (as on Home and About).
 * - The photo credits sit under it as fine print, after everything a visitor came for: one line per photo,
 *   linking the author's file page and the licence deed, as the CC licences ask.
 */
export default function SpecialOffersPage() {
  return (
    <>
      <Section className="relative">
        {/* Covers the title and fades out behind the top of the panels. */}
        <HeroBackdrop asset="toursBackdrop" className="hero-backdrop-tours bottom-auto h-[24rem] md:h-[28rem]" />
        <div className="flex flex-col gap-10 md:gap-12">
          <PageHeader title={t.title} description={t.subtitle} display />

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
            {t.priceLists.map((list) => (
              <section
                key={list.id}
                id={list.id}
                aria-labelledby={`${list.id}-heading`}
                className="flex scroll-mt-28 flex-col gap-5"
              >
                <div className="flex flex-col gap-1">
                  <h2 id={`${list.id}-heading`} className="text-2xl font-extrabold tracking-display md:text-3xl">
                    {list.title}
                  </h2>
                  <p className="text-lg font-medium text-muted">{list.capacity}</p>
                </div>
                <ul className="flex flex-col gap-3">
                  {list.items.map((item) => {
                    const photo = tourPhotos[item.name];
                    return (
                      // Each row is a tile over a photo of where it goes (faded under the name and price, see .tour-row-photo).
                      <li
                        key={item.name}
                        className="relative isolate flex min-h-[5.5rem] items-center gap-4 overflow-hidden rounded-xl border border-border bg-surface px-4 py-3 md:px-6"
                      >
                        {photo?.src && (
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes="(min-width: 64rem) 32rem, 100vw"
                            className="tour-row-photo -z-10 object-cover"
                          />
                        )}
                        <span className="min-w-0 flex-1 text-lg font-semibold">{item.name}</span>
                        {/* No unit here, so no gap for one: the peso amount and the USD line both end on the right edge. */}
                        <Price amount={item.price} className="shrink-0 gap-x-0 text-right" />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

        </div>
      </Section>

      <CtaBanner title={t.cta.title} buttonLabel={t.cta.button} href="/contact" />

      <Section aria-labelledby="photo-credits-heading" className="pt-0 md:pt-0">
        <div className="flex flex-col gap-3 border-t border-border pt-6 text-xs leading-relaxed text-muted">
          <h2 id="photo-credits-heading" className="font-body text-sm font-semibold tracking-normal text-muted">
            {t.photoCredits.title}
          </h2>
          <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {credited.map((photo) => {
              const license = licenseHref(photo.credit!.license);
              return (
                <li key={photo.src}>
                  <span className="text-foreground">{photo.label}</span>
                  {" · "}
                  <a href={photo.credit!.href} target="_blank" rel="noopener noreferrer" className="text-muted">
                    {photo.credit!.author}
                  </a>
                  {" · "}
                  {license ? (
                    <a href={license} target="_blank" rel="noopener noreferrer license" className="whitespace-nowrap text-muted">
                      {photo.credit!.license}
                    </a>
                  ) : (
                    <span className="whitespace-nowrap">{photo.credit!.license}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p>{t.photoCredits.note}</p>
        </div>
      </Section>
    </>
  );
}
