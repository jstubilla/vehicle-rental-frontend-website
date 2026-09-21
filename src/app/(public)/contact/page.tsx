import type { Metadata } from "next";
import { getVehicleBySlug } from "@/api/vehicles";
import { Card, CardContent, CardHeader, CardTitle, Media, PageHeader, Section } from "@/components/ui";
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

  const details = [
    [t.details.phone, content.site.contactPhone],
    [t.details.email, content.site.contactEmail],
    [t.details.address, t.details.addressValue],
    [t.details.hours, t.details.hoursValue],
  ] as const;

  return (
    <>
      <Section className="pb-0">
        <PageHeader title={t.title} description={t.subtitle} />
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <section aria-labelledby="details-heading" className="flex flex-col gap-4">
              <h2 id="details-heading">{t.details.title}</h2>
              <dl className="flex flex-col gap-3">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <Media asset="contact" sizes="(min-width: 64rem) 50vw, 100vw" />
          </div>

          <Card as="section" aria-labelledby="form-heading">
            <CardHeader>
              <CardTitle as="h2" id="form-heading" className="text-2xl">
                {t.form.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm defaultVehicleId={vehicle?.id} />
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  );
}
