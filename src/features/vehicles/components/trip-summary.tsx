import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { content } from "@/content";
import { formatDateLong, formatTime12h } from "@/lib/dates";
import type { RentalSearch } from "@/lib/rental";
import type { Location } from "@/types";

/** Reminds the visitor which dates and place they searched for. */
export function TripSummary({
  rental,
  days,
  locations,
}: {
  rental: RentalSearch;
  days: number;
  locations: Location[];
}) {
  const t = content.vehicles.trip;
  const place = locations.find((l) => l.id === rental.pickupLocation);

  return (
    <Card variant="muted" as="section" aria-label={t.title}>
      <CardContent className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between md:pt-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted">{t.pickup}</dt>
            <dd className="font-medium">
              {place?.name ?? rental.pickupLocation}
              <br />
              {formatDateLong(rental.pickupDate)}, {formatTime12h(rental.pickupTime)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t.return}</dt>
            <dd className="font-medium">
              {formatDateLong(rental.returnDate)}, {formatTime12h(rental.returnTime)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t.duration}</dt>
            <dd className="font-medium">{t.days(days)}</dd>
          </div>
        </dl>
        <Button asChild variant="outline" size="sm">
          <Link href="/#search">{t.change}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
