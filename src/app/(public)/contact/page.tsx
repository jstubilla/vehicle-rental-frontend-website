import type { Metadata } from "next";
import { getVehicleBySlug } from "@/api/vehicles";
import { Card, Media, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { ContactForm } from "@/features/contact/contact-form";
import { buildMetadata } from "@/lib/seo";

const t = content.contact;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/contact" });

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  // "/contact?vehicle=toyota-vios-2024" preselects that vehicle (used by "Ask about this vehicle").
  const { vehicle: vehicleSlug } = await searchParams;
  const vehicle = vehicleSlug ? await getVehicleBySlug(vehicleSlug) : null;

  const phoneHref = `tel:${content.site.contactPhone.replace(/[^+\d]/g, "")}`;

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
        {/* Phones: the photo drops below the form, so the form follows straight after the details. */}
        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-10">
          <PageHeader title={t.title} description={t.subtitle} />

          <section aria-labelledby="details-heading" className="flex flex-col gap-8">
            <h2 id="details-heading" className="sr-only">
              {t.details.title}
            </h2>
            {/* Phone and hours lead: most people call. Email and address follow, smaller. */}
            <dl className="ledger">
              <div className="flex flex-col gap-1 py-5">
                <dt className="text-sm text-muted">{t.details.phone}</dt>
                <dd>
                  <a
                    href={phoneHref}
                    className="font-heading text-3xl font-extrabold tracking-display text-foreground no-underline tabular-nums underline-offset-4 hover:underline md:text-4xl"
                  >
                    {content.site.contactPhone}
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-5">
                <dt className="text-sm text-muted">{t.details.hours}</dt>
                <dd className="font-heading text-xl font-bold tracking-tight">{t.details.hoursValue}</dd>
              </div>
            </dl>
            <dl className="grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-muted">{t.details.email}</dt>
                <dd className="font-medium">
                  <a href={`mailto:${content.site.contactEmail}`}>{content.site.contactEmail}</a>
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-sm text-muted">{t.details.address}</dt>
                <dd className="font-medium">{t.details.addressValue}</dd>
              </div>
            </dl>
          </section>
          <Media asset="contact" sizes="(min-width: 64rem) 40vw, 100vw" className="order-last lg:order-none" />
        </div>

        {/* The form is the one thing to do here, so it is raised off the page like the home booking bar. */}
        <Card
          as="section"
          variant="raised"
          aria-labelledby="form-heading"
          className="gap-6 self-start p-5 sm:p-6 md:p-8 lg:col-span-7"
        >
          <h2 id="form-heading" className="text-2xl font-extrabold tracking-display">
            {t.form.title}
          </h2>
          <ContactForm defaultVehicleId={vehicle?.id} />
        </Card>
      </div>
    </Section>
  );
}
