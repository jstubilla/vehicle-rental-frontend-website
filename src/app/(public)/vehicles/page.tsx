import type { Metadata } from "next";
import { Suspense } from "react";
import { searchVehicles } from "@/api/vehicles";
import { PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { VehicleCatalog } from "@/features/vehicles/components/vehicle-catalog";
import { VehicleGridSkeleton } from "@/features/vehicles/components/vehicle-grid";
import { buildMetadata } from "@/lib/seo";
import { parseVehicleFilters } from "@/lib/vehicle-filters";

const t = content.vehicles;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/vehicles" });

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The server renders the first results so the catalog is visible to search engines;
  // the client takes over for filtering, sorting and paging.
  const params = await searchParams;
  const filters = parseVehicleFilters(params);
  const result = await searchVehicles(filters);

  return (
    <>
      <Section className="pb-6">
        <PageHeader title={t.title} description={t.description} />
      </Section>
      <Suspense
        fallback={
          <Section className="pt-0">
            <VehicleGridSkeleton />
          </Section>
        }
      >
        <VehicleCatalog initial={{ filters, result }} />
      </Suspense>
    </>
  );
}
