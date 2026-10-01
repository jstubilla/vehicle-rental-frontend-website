"use client";

import { useId, useState } from "react";
import { AutoHeight, Card, ChevronDownIcon, Price } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { formatDateLong, formatTime12h } from "@/lib/dates";
import type { SummaryData } from "../summary";

const t = content.booking.summary;

/** A new total fades in (it is keyed by the amount), so a change in the side panel is noticed. */
const totalChange = "transition-opacity duration-(--duration-base) ease-out starting:opacity-0";

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

/**
 * The price and trip details so far. Used on steps 2 to 5 and on the confirmation page.
 * `collapsible`: on phones it folds down to its title and total, and opens on tap; from the lg
 * breakpoint up it is always open (it sits beside the step there).
 */
export function BookingSummary({
  data,
  collapsible = false,
  className,
}: {
  data: SummaryData;
  collapsible?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const totalId = useId();
  const hasTotal =
    data.total !== null && data.dailyRate !== null && data.vehicleTotal !== null && data.days !== null;

  return (
    <Card as="section" aria-labelledby="summary-heading" className={cn("min-w-0 wrap-anywhere", className)}>
      <div className="flex items-center justify-between gap-4 p-4 md:px-6 md:pt-5">
        <h2 id="summary-heading" className="text-lg">
          {t.title}
        </h2>
        {collapsible && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-labelledby={hasTotal ? `summary-heading ${totalId}` : "summary-heading"}
            onClick={() => setOpen((value) => !value)}
            className="-my-2 -mr-2 flex min-h-control items-center gap-2 rounded-md px-2 text-foreground lg:hidden"
          >
            {hasTotal && (
              <span id={totalId} key={data.total} className={totalChange}>
                <Price amount={data.total!} size="sm" usd="none" exact />
              </span>
            )}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("size-5 transition-transform duration-(--duration-base) ease-out-strong", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      <div
        id={bodyId}
        className={cn(
          collapsible &&
            "grid transition-[grid-template-rows,visibility] duration-(--duration-base) ease-out-strong lg:visible lg:grid-rows-[1fr]",
          collapsible && (open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"),
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden",
            collapsible && "transition-opacity duration-(--duration-base) ease-out-strong lg:opacity-100",
            collapsible && !open && "opacity-0",
          )}
        >
          <AutoHeight>
            <div className="flex flex-col gap-4 border-t border-border p-4 md:px-6 md:pb-6">
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

              {hasTotal && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p>{t.vehicleLine}</p>
                      <p className="text-sm text-muted">{t.rate(formatCurrency(data.dailyRate!), data.days!)}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(data.vehicleTotal!)}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
                    <p className="text-lg font-semibold">{t.total}</p>
                    <Price
                      key={data.total}
                      amount={data.total!}
                      size="lg"
                      exact
                      className={cn("justify-items-end text-right", totalChange)}
                    />
                  </div>
                  <p className="text-sm text-muted">{t.pricesNote}</p>
                </div>
              )}
            </div>
          </AutoHeight>
        </div>
      </div>
    </Card>
  );
}
