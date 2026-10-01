"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, ButtonArrow, ChevronLeftIcon, Price, Section } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { parseRentalSearch } from "@/lib/rental";
import type { Vehicle } from "@/types";
import { useVehicle } from "../hooks/use-vehicles";
import { bookHref } from "../links";
import { VehicleGallery } from "./vehicle-gallery";

interface VehicleDetailProps {
  slug: string;
  /** The vehicle the server rendered. The client then refreshes it (e.g. after a price change). */
  initialVehicle: Vehicle;
}

export function VehicleDetail({ slug, initialVehicle }: VehicleDetailProps) {
  const t = content.vehicleDetail;
  const searchParams = useSearchParams();
  const rental = parseRentalSearch(searchParams);
  const { data } = useVehicle(slug, initialVehicle);
  const vehicle = data ?? initialVehicle;

  const available = vehicle.status === "available";
  const specs = [
    [t.specs.example, vehicle.examples],
    [t.specs.category, content.enums.vehicleCategory[vehicle.category]],
    ...(vehicle.seats !== undefined ? [[t.specs.seats, t.upTo(vehicle.seats)] as const] : []),
  ];

  return (
    <Section className="pt-6 md:pt-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <Link
          href="/vehicles"
          className="inline-flex min-h-control-sm items-center gap-1 self-start text-sm font-semibold underline-offset-4 hover:underline"
        >
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
          {t.back}
        </Link>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <VehicleGallery images={vehicle.images} />
          </div>

          <aside aria-label={vehicle.name} className="order-first lg:order-none lg:col-span-5">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <div className="flex flex-col gap-4">
                <h1>{vehicle.name}</h1>
                <section aria-labelledby="specs-heading">
                  <h2 id="specs-heading" className="sr-only">
                    {t.specsTitle}
                  </h2>
                  <dl className="flex flex-wrap gap-x-8 gap-y-3">
                    {specs.map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-sm text-muted">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>

              {/* The decision block: raised like the home page's booking bar, since this is where you book. */}
              <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-float md:p-6">
                <Price amount={vehicle.pricePerDay} unit={t.perDay} size="xl" />
                <div className="flex flex-col">
                  <h2 className="text-sm font-normal text-muted">{t.availabilityTitle}</h2>
                  <p className={cn("font-semibold", available ? "text-success" : "text-warning")}>
                    {available ? t.availableNow : t.unavailableNow}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {available ? (
                    <Button asChild size="lg" variant="accent">
                      <Link href={bookHref(vehicle.slug, rental)}>
                        {t.bookNow}
                        <ButtonArrow />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" variant="accent" disabled>
                      {t.bookNow}
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link href={`/contact?vehicle=${vehicle.slug}`}>{t.askAbout}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Section>
  );
}
