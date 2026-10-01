import Link from "next/link";
import { content } from "@/content";
import { formatDateLong, formatTime12h } from "@/lib/dates";
import type { RentalSearch } from "@/lib/rental";

/** Reminds the visitor which dates and place they searched for. */
export function TripSummary({ rental, days }: { rental: RentalSearch; days: number }) {
  const t = content.vehicles.trip;

  return (
    <section
      aria-label={t.title}
      className="flex flex-col gap-3 border-y border-border py-4 md:flex-row md:items-center md:justify-between md:gap-6"
    >
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[2fr_2fr_1fr]">
        <div>
          <dt className="text-sm text-muted">{t.pickup}</dt>
          <dd className="font-medium">
            {rental.pickupLocation}
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
      <Link href="/#search" className="shrink-0 font-semibold underline-offset-4 hover:underline">
        {t.change}
      </Link>
    </section>
  );
}
