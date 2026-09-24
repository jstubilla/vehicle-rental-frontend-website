"use client";

import { useState } from "react";
import { Button, EmptyState, ErrorState, FormField, Pagination, Section, Select } from "@/components/ui";
import { content } from "@/content";
import { VEHICLE_SORTS } from "@/lib/constants";
import type { VehicleFilters } from "@/lib/vehicle-filters";
import { useVehicleSearch, type InitialVehicleSearch } from "../hooks/use-vehicle-search";
import { TripSummary } from "./trip-summary";
import { VehicleFiltersPanel } from "./vehicle-filters";
import { VehicleGrid, VehicleGridSkeleton } from "./vehicle-grid";

interface VehicleCatalogProps {
  /** What the server already rendered for this URL. */
  initial?: InitialVehicleSearch;
}

export function VehicleCatalog({ initial }: VehicleCatalogProps) {
  const t = content.vehicles;
  const search = useVehicleSearch(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { result, filters, rental, days } = search;

  function changePage(page: number) {
    search.setFilters({ page });
    document.getElementById("vehicle-results")?.scrollIntoView();
  }

  return (
    <Section className="pt-0" aria-label={t.resultsLabel}>
      <div className="flex flex-col gap-6">
        <h2 className="sr-only">{t.resultsLabel}</h2>
        {rental && days && <TripSummary rental={rental} days={days} />}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Button
              variant="outline"
              className="w-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="vehicle-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? t.hideFilters : t.showFilters}
              {search.activeFilterCount > 0 && ` (${search.activeFilterCount})`}
            </Button>
            <div id="vehicle-filters" className={filtersOpen ? "mt-4 block lg:mt-0" : "hidden lg:block"}>
              <VehicleFiltersPanel
                filters={filters}
                onChange={search.setFilters}
                onReset={search.reset}
                activeCount={search.activeFilterCount}
              />
            </div>
          </div>

          <div id="vehicle-results" className="flex scroll-mt-24 flex-col gap-4 lg:col-span-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {result ? t.resultCount(result.total) : " "}
              </p>
              <FormField label={t.sortLabel} className="sm:w-56">
                <Select
                  value={filters.sort}
                  onChange={(e) => search.setFilters({ sort: e.target.value as VehicleFilters["sort"] })}
                >
                  {VEHICLE_SORTS.map((sort) => (
                    <option key={sort} value={sort}>
                      {t.sorts[sort]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {search.isError && !result ? (
              <ErrorState onRetry={() => search.refetch()} />
            ) : !result ? (
              <VehicleGridSkeleton />
            ) : result.items.length === 0 ? (
              <EmptyState
                title={t.emptyTitle}
                description={t.emptyDescription}
                action={<Button variant="outline" onClick={search.reset}>{t.clearFilters}</Button>}
              />
            ) : (
              <div aria-busy={search.isFetching} className={search.isFetching ? "opacity-60" : undefined}>
                <VehicleGrid vehicles={result.items} rental={rental} days={days} />
              </div>
            )}

            {result && (
              <Pagination page={result.page} pageCount={result.pageCount} onPageChange={changePage} />
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
