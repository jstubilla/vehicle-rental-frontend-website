import { images } from "@/assets/config";
import { Badge, Button, Card, Media } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { calcRentalTotal } from "@/lib/rental";
import type { Vehicle } from "@/types";

const t = content.booking.vehicle;

interface VehicleOptionProps {
  vehicle: Vehicle;
  available: boolean;
  days: number;
  selected: boolean;
  onSelect: () => void;
}

/** One vehicle in the booking flow, with a Select button. */
export function VehicleOption({ vehicle, available, days, selected, onSelect }: VehicleOptionProps) {
  return (
    <Card
      as="article"
      variant="outline"
      className={cn("gap-4 p-4 md:flex-row", selected && "border-2 border-primary")}
    >
      <div className="md:w-56 md:shrink-0">
        <Media asset={vehicle.images[0] ?? images.vehicle} sizes="(min-width: 48rem) 14rem, 100vw" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{vehicle.name}</h3>
          <p className="text-sm text-muted">
            {content.enums.vehicleCategory[vehicle.category]} · {content.enums.transmission[vehicle.transmission]} ·{" "}
            {content.vehicleCard.seats(vehicle.seats)} · {content.enums.fuel[vehicle.fuel]}
          </p>
          <p>
            <span className="text-xl font-semibold">{formatCurrency(vehicle.pricePerDay)}</span>{" "}
            <span className="text-sm text-muted">{content.vehicleCard.perDay}</span>
          </p>
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
          {!available && <Badge variant="warning">{t.unavailable}</Badge>}
        </div>
      </div>
    </Card>
  );
}
