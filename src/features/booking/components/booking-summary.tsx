import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { formatDateLong, formatTime12h } from "@/lib/dates";
import type { SummaryData } from "../summary";

const t = content.booking.summary;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function Trip({ point }: { point: NonNullable<SummaryData["pickup"]> }) {
  return (
    <>
      {point.location}
      <br />
      <span className="font-normal">
        {formatDateLong(point.date)}, {formatTime12h(point.time)}
      </span>
    </>
  );
}

/** The price and trip details so far. Used on steps 2 to 5 and on the confirmation page. */
export function BookingSummary({ data, className }: { data: SummaryData; className?: string }) {
  return (
    <Card as="section" aria-labelledby="summary-heading" className={cn("min-w-0 wrap-anywhere", className)}>
      <CardHeader>
        <CardTitle as="h2" id="summary-heading" className="text-xl">
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3">
          <Row label={t.vehicle}>
            {data.vehicle ? (
              <>
                {data.vehicle.name}
                <br />
                <span className="text-sm font-normal text-muted">{data.vehicle.meta}</span>
              </>
            ) : (
              <span className="font-normal text-muted">{t.noVehicle}</span>
            )}
          </Row>
          {data.pickup && (
            <Row label={t.pickup}>
              <Trip point={data.pickup} />
            </Row>
          )}
          {data.returnTrip && (
            <Row label={t.return}>
              <Trip point={data.returnTrip} />
            </Row>
          )}
          {data.days !== null && <Row label={t.duration}>{t.days(data.days)}</Row>}
          {data.driver && (
            <Row label={t.driver}>
              {data.driver.name}
              <br />
              <span className="text-sm font-normal text-muted">
                {data.driver.email} · {data.driver.phone}
              </span>
            </Row>
          )}
          {data.payment && <Row label={t.payment}>{data.payment}</Row>}
        </dl>

        {data.total !== null && data.dailyRate !== null && data.vehicleTotal !== null && data.days !== null && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p>{t.vehicleLine}</p>
                <p className="text-sm text-muted">{t.rate(formatCurrency(data.dailyRate), data.days)}</p>
              </div>
              <p className="font-medium">{formatCurrency(data.vehicleTotal)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-lg font-semibold">
              <p>{t.total}</p>
              <p className="text-price">{formatCurrency(data.total)}</p>
            </div>
            <p className="text-sm text-muted">{t.pricesNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
