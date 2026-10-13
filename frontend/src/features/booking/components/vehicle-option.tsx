import { images } from "@/assets/config";
import { Badge, Button, Card, FieldGroup, Media, Price, RadioGroup } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { DRIVER_DAILY_RATE, offersDriver } from "@/lib/pricing";
import { calcRentalTotal } from "@/lib/rental";
import type { Vehicle } from "@/types";

const t = content.booking.vehicle;

interface VehicleOptionProps {
  vehicle: Vehicle;
  available: boolean;
  days: number;
  selected: boolean;
  onSelect: () => void;
  /** "With a driver" chosen. Only asked on the selected car or van. */
  withDriver: boolean;
  onWithDriverChange: (withDriver: boolean) => void;
}

/**
 * One vehicle in the booking flow, with a Select button. Once a car or van is selected, it also asks
 * "Vehicle only" or "With a driver" right there, where the decision is being made.
 */
export function VehicleOption({
  vehicle,
  available,
  days,
  selected,
  onSelect,
  withDriver,
  onWithDriverChange,
}: VehicleOptionProps) {
  const d = content.booking.driverOption;
  const askDriver = selected && available && offersDriver(vehicle.category);

  return (
    <Card
      as="article"
      variant="outline"
      className={cn(
        "gap-4 p-3 transition-[border-color,box-shadow] duration-(--duration-fast) md:flex-row md:p-4",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="md:w-56 md:shrink-0">
        <Media
          asset={vehicle.images[0] ?? images.vehicle}
          sizes="(min-width: 48rem) 14rem, 100vw"
          className="aspect-video"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{vehicle.name}</h3>
          <p className="text-sm text-muted">
            {vehicle.examples}
            {vehicle.seats !== undefined && ` · ${content.vehicleCard.seats(vehicle.seats)}`}
          </p>
          <Price amount={vehicle.pricePerDay} unit={content.vehicleCard.perDay} usd="inline" className="mt-1" />
          <p className="text-sm text-muted">
            {content.vehicleCard.totalFor(days)}: {formatCurrency(calcRentalTotal(vehicle.pricePerDay, days))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selected ? "primary" : "outline"}
            disabled={!available}
            aria-pressed={selected}
            onClick={onSelect}
          >
            {selected ? t.selected : t.select}
            <span className="sr-only"> {vehicle.name}</span>
          </Button>
          {!available && <Badge variant="warning">{t.notAvailable}</Badge>}
        </div>
        {askDriver && (
          <FieldGroup label={d.legend} className="border-t border-border pt-3">
            <RadioGroup
              name={`driver-${vehicle.slug}`}
              variant="cards"
              value={withDriver ? "driver" : "vehicle"}
              onValueChange={(value) => onWithDriverChange(value === "driver")}
              options={[
                { value: "vehicle", label: d.vehicleOnly, description: d.vehicleOnlyDescription },
                {
                  value: "driver",
                  label: d.withDriver,
                  description: d.withDriverDescription,
                  end: <Price amount={DRIVER_DAILY_RATE} size="sm" unit={d.perDay} />,
                },
              ]}
            />
          </FieldGroup>
        )}
      </div>
    </Card>
  );
}
