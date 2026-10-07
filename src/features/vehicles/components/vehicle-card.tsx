import Link from "next/link";
import { images } from "@/assets/config";
import { Badge, Button, Card, Media, Price } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { calcRentalTotal, type RentalSearch } from "@/lib/rental";
import type { Vehicle } from "@/types";
import { bookHref, vehicleHref } from "../links";

export type VehicleCardLayout = "tile" | "feature" | "row";

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Chosen dates, if the visitor searched. Shows the total for the trip. */
  rental?: RentalSearch | null;
  days?: number | null;
  /**
   * "tile": the catalog card. "feature": the large lead card on the home page.
   * "row": a compact horizontal entry, listed beside a feature card.
   */
  layout?: VehicleCardLayout;
}

/**
 * One vehicle. The whole card links to the detail page (the name's link stretches over it);
 * "Book now" is the one separate action, a shortcut straight into the booking.
 */
export function VehicleCard({ vehicle, rental = null, days = null, layout = "tile" }: VehicleCardProps) {
  const t = content.vehicleCard;
  const available = vehicle.status === "available";
  const href = vehicleHref(vehicle.slug, rental);
  const isRow = layout === "row";

  return (
    <Card
      as="article"
      className={cn(
        // Hover: the card lifts a step and its picture eases in. Both stay small: it is a list people scan.
        "group relative h-full overflow-hidden transition-[border-color,box-shadow,transform] duration-(--duration-modal) ease-out-strong hover:border-border-strong hover:shadow-lg focus-within:border-border-strong motion-safe:hover:-translate-y-0.5",
        isRow && "flex-row",
      )}
    >
      {/*
        Row cards stretch taller than their photo, so they show the whole photo on the photos' own backdrop
        colour (#edeef2) rather than cropping the vehicle.
      */}
      <Media
        zoom
        fit={isRow ? "contain" : "cover"}
        asset={vehicle.images[0] ?? images.vehicle}
        sizes={
          layout === "feature"
            ? "(min-width: 64rem) 55vw, 100vw"
            : isRow
              ? "10rem"
              : "(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
        }
        className={cn(
          "rounded-none border-0",
          isRow ? "aspect-square w-28 shrink-0 border-r bg-[#edeef2]! sm:w-40 sm:aspect-photo" : "aspect-video border-b",
        )}
      />

      <div className={cn("flex flex-1 flex-col gap-4 p-4", layout === "feature" && "md:gap-6 md:p-6", isRow && "gap-2 py-3")}>
        <div className="flex flex-col gap-1">
          <h3 className={cn(layout === "feature" ? "text-xl md:text-2xl" : "text-lg")}>
            <Link
              href={href}
              className="text-inherit no-underline underline-offset-4 after:absolute after:inset-0 group-hover:underline"
            >
              {vehicle.name}
            </Link>
          </h3>
          <p className="text-sm text-muted">
            {vehicle.examples}
            {vehicle.seats !== undefined && (
              <>
                {" · "}
                <span className="whitespace-nowrap">{t.seats(vehicle.seats)}</span>
              </>
            )}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Price
              amount={vehicle.pricePerDay}
              unit={t.perDay}
              size={layout === "feature" ? "xl" : "md"}
            />
            {days && (
              <p className="text-sm text-muted">
                {t.totalFor(days)}: {formatCurrency(calcRentalTotal(vehicle.pricePerDay, days))}
              </p>
            )}
            {!available && (
              <p>
                <Badge variant="warning">{t.unavailable}</Badge>
              </p>
            )}
          </div>

          {available ? (
            <Button asChild size="sm" variant="outline" className="relative z-10">
              <Link href={bookHref(vehicle.slug, rental)}>{t.bookNow}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled className="relative z-10">
              {t.bookNow}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
