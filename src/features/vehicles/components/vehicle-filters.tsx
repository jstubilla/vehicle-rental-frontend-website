"use client";

import { Button, FormField, Select } from "@/components/ui";
import { content } from "@/content";
import { PRICE_FILTER_STEPS, SEAT_FILTER_OPTIONS, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { VehicleFilters } from "@/lib/vehicle-filters";

interface VehicleFiltersProps {
  filters: VehicleFilters;
  onChange: (patch: Partial<VehicleFilters>) => void;
  onReset: () => void;
  activeCount: number;
}

/** Filter controls. Every change updates the URL through `onChange`. */
export function VehicleFiltersPanel({ filters, onChange, onReset, activeCount }: VehicleFiltersProps) {
  const t = content.vehicles.filters;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label={content.vehicles.filtersTitle}
      className="flex flex-col gap-4"
    >
      <FormField label={t.category}>
        <Select
          value={filters.category ?? ""}
          onChange={(e) => onChange({ category: (e.target.value || undefined) as VehicleFilters["category"] })}
        >
          <option value="">{t.any}</option>
          {VEHICLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {content.enums.vehicleCategory[c]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t.minSeats}>
        <Select
          value={filters.minSeats ?? ""}
          onChange={(e) => onChange({ minSeats: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t.any}</option>
          {SEAT_FILTER_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {t.seatsOrMore(n)}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t.minPrice}>
        <Select
          value={filters.minPrice ?? ""}
          onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t.noMinimum}</option>
          {PRICE_FILTER_STEPS.map((p) => (
            <option key={p} value={p} disabled={filters.maxPrice !== undefined && p > filters.maxPrice}>
              {formatCurrency(p)}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label={t.maxPrice}>
        <Select
          value={filters.maxPrice ?? ""}
          onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">{t.noMaximum}</option>
          {PRICE_FILTER_STEPS.map((p) => (
            <option key={p} value={p} disabled={filters.minPrice !== undefined && p < filters.minPrice}>
              {formatCurrency(p)}
            </option>
          ))}
        </Select>
      </FormField>

      <Button variant="outline" onClick={onReset} disabled={activeCount === 0}>
        {content.vehicles.clearFilters}
      </Button>
    </form>
  );
}
