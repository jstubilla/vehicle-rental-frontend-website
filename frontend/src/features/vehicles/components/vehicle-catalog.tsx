"use client";

import { useState } from "react";
import { Button, ChevronDownIcon, EmptyState, ErrorState, FormField, Pagination, Section, Select } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
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
  // Results animate in when the list itself changes (new filters, sort or page), never on the first load.
  const resultsKey = result ? `${result.page}:${result.items.map((v) => v.id).join(",")}` : "";
  const [firstKey] = useState(resultsKey);

  function changePage(page: number) {
    search.setFilters({ page });
    document.getElementById("vehicle-results")?.scrollIntoView();
  }

  return (
    <Section className="pt-0 md:pt-0" aria-label={t.resultsLabel}>
      <div className="flex flex-col gap-6">
        <h2 className="sr-only">{t.resultsLabel}</h2>
        {rental && days && <TripSummary rental={rental} days={days} />}

        <div className="grid gap-6 lg:grid-cols-[var(--spacing-sidebar)_1fr] lg:gap-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Button
              variant="outline"
              className="w-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="vehicle-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? t.hideFilters : t.showFilters}
              {search.activeFilterCount > 0 && ` (${search.activeFilterCount})`}
              <ChevronDownIcon
                aria-hidden="true"
                className={cn("transition-transform duration-(--duration-base) ease-out-strong", filtersOpen && "rotate-180")}
              />
            </Button>
            <div
              id="vehicle-filters"
              className={cn(
                "grid transition-[grid-template-rows,visibility] duration-(--duration-base) ease-out-strong lg:visible lg:grid-rows-[1fr]",
                filtersOpen ? "visible mt-4 grid-rows-[1fr] lg:mt-0" : "invisible grid-rows-[0fr] lg:mt-0",
              )}
            >
              <div
                className={cn(
                  "overflow-hidden transition-opacity duration-(--duration-base) ease-out-strong lg:opacity-100",
                  !filtersOpen && "opacity-0",
                )}
              >
                {/* Ruled like the results bar opposite, so both columns open on one line, as on the other pages' ledgers. */}
                <div className="ledger mb-4 hidden lg:block">
                  <h2 className="box-content flex min-h-control items-center pt-3 text-base">{t.filtersTitle}</h2>
                </div>
                <VehicleFiltersPanel
                  filters={filters}
                  onChange={search.setFilters}
                  onReset={search.reset}
                  activeCount={search.activeFilterCount}
                />
              </div>
            </div>
          </div>

          <div id="vehicle-results" className="flex min-w-0 scroll-mt-24 flex-col gap-4">
            <div className="ledger">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
                <p role="status" aria-live="polite" className="font-medium">
                  {result ? t.resultCount(result.total) : " "}
                </p>
                <FormField
                  label={t.sortLabel}
                  className="flex-row items-center gap-2 [&_label]:whitespace-nowrap [&_label]:font-normal [&_label]:text-muted"
                >
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
              <div
                aria-busy={search.isFetching}
                className={cn("transition-opacity duration-(--duration-fast)", search.isFetching && "opacity-60")}
              >
                <VehicleGrid
                  key={resultsKey}
                  vehicles={result.items}
                  rental={rental}
                  days={days}
                  animate={resultsKey !== firstKey}
                />
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
