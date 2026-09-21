import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getVehicleBySlug, listVehicles } from "@/api/vehicles";
import { Section, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { VehicleDetail } from "@/features/vehicles/components/vehicle-detail";
import { formatCurrency } from "@/lib/currency";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

/** Pre-builds a page for every vehicle so they load instantly and can be indexed. */
export async function generateStaticParams() {
  const vehicles = await listVehicles();
  return vehicles.map((vehicle) => ({ slug: vehicle.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: content.vehicleDetail.metaFallbackTitle };

  return buildMetadata({
    title: vehicle.name,
    description: content.vehicleDetail.metaDescription(vehicle.name, formatCurrency(vehicle.pricePerDay)),
    path: `/vehicles/${vehicle.slug}`,
  });
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  return (
    <Suspense
      fallback={
        <Section>
          <Skeleton className="aspect-photo h-auto" />
        </Section>
      }
    >
      <VehicleDetail slug={slug} initialVehicle={vehicle} />
    </Suspense>
  );
}
