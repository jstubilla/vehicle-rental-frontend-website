"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Section,
} from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
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
    <Section>
      <div className="flex flex-col gap-6">
        <Button asChild variant="link" className="self-start">
          <Link href="/vehicles">← {t.back}</Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <VehicleGallery images={vehicle.images} />

            <section aria-labelledby="specs-heading" className="flex flex-col gap-2">
              <h2 id="specs-heading">{t.specsTitle}</h2>
              <dl className="grid gap-x-6 sm:grid-cols-2">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-border py-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <aside aria-label={vehicle.name} className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <h1 className="text-2xl md:text-3xl">{vehicle.name}</h1>
                <p>
                  <span className="text-3xl font-semibold text-price">{formatCurrency(vehicle.pricePerDay)}</span>{" "}
                  <span className="text-muted">{t.perDay}</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle as="h2" className="text-base">
                    {t.availabilityTitle}
                  </CardTitle>
                  <p>
                    <Badge variant={available ? "success" : "warning"}>
                      {available ? t.availableNow : t.unavailableNow}
                    </Badge>
                  </p>
                </div>
                {available ? (
                  <Button asChild size="lg" variant="accent">
                    <Link href={bookHref(vehicle.slug, rental)}>{t.bookNow}</Link>
                  </Button>
                ) : (
                  <Button size="lg" variant="accent" disabled>
                    {t.bookNow}
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/contact?vehicle=${vehicle.slug}`}>{t.askAbout}</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Section>
  );
}
