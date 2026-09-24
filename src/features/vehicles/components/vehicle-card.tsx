import Link from "next/link";
import { images } from "@/assets/config";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Media } from "@/components/ui";
import { content } from "@/content";
import { formatCurrency } from "@/lib/currency";
import { calcRentalTotal, type RentalSearch } from "@/lib/rental";
import type { Vehicle } from "@/types";
import { bookHref, vehicleHref } from "../links";

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Chosen dates, if the visitor searched. Shows the total for the trip. */
  rental?: RentalSearch | null;
  days?: number | null;
}

export function VehicleCard({ vehicle, rental = null, days = null }: VehicleCardProps) {
  const t = content.vehicleCard;
  const available = vehicle.status === "available";

  return (
    <Card as="article" className="h-full">
      <Media
        asset={vehicle.images[0] ?? images.vehicle}
        sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
        className="rounded-b-none border-0 border-b"
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle as="h3">
            <Link href={vehicleHref(vehicle.slug, rental)} className="text-inherit no-underline hover:underline">
              {vehicle.name}
            </Link>
          </CardTitle>
          <Badge variant="outline">{content.enums.vehicleCategory[vehicle.category]}</Badge>
        </div>
        {vehicle.seats !== undefined && <CardDescription>{t.seats(vehicle.seats)}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p>
          <span className="text-2xl font-semibold text-price">{formatCurrency(vehicle.pricePerDay)}</span>{" "}
          <span className="text-sm text-muted">{t.perDay}</span>
        </p>
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
      </CardContent>
      <CardFooter className="flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link href={vehicleHref(vehicle.slug, rental)}>{t.viewDetails}</Link>
        </Button>
        {available ? (
          <Button asChild size="sm" variant="accent">
            <Link href={bookHref(vehicle.slug, rental)}>{t.bookNow}</Link>
          </Button>
        ) : (
          <Button size="sm" variant="accent" disabled>
            {t.bookNow}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
