"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface BarChartProps {
  /** What the chart shows. Also read out by screen readers. */
  label: string;
  categories: string[];
  series: ChartSeries[];
  formatValue?: (value: number) => string;
  /** A shorter format for the numbers drawn on the chart (axis and bar labels). Defaults to `formatValue`. */
  formatLabel?: (value: number) => string;
  /** Accessible name for the sideways-scrolling area on small screens. */
  scrollLabel?: string;
  className?: string;
}

// Drawing space in SVG units (the chart scales to fit its container).
const WIDTH = 640;
const HEIGHT = 300;
const MARGIN = { top: 24, right: 16, bottom: 44, left: 72 };
const TICKS = 4;

/** Rounds a maximum up to a tidy axis end: 37 becomes 40, 1,830 becomes 2,000. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return step * power;
}

const SERIES_FILL = ["fill-primary", "fill-accent", "fill-muted"] as const;
const SERIES_SWATCH = ["bg-primary", "bg-accent", "bg-muted"] as const;

/**
 * A simple bar chart (one or more series). Every bar has its value written above it,
 * so nothing depends on hovering or on color alone. Pair it with a table of the same data.
 * Hovering a month (mouse) or tapping it (touch) shows its exact values in a tooltip,
 * which matters when `formatLabel` shortens the numbers drawn on the chart.
 */
export function BarChart({
  label,
  categories,
  series,
  formatValue = String,
  formatLabel = formatValue,
  scrollLabel,
  className,
}: BarChartProps) {
  const id = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  // The category whose exact values are showing, or null.
  const [active, setActive] = useState<number | null>(null);

  // A tap outside the chart or Escape closes the tooltip.
  useEffect(() => {
    if (active === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) setActive(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const band = plotWidth / Math.max(categories.length, 1);
  const barWidth = (band * 0.7) / Math.max(series.length, 1);
  const y = (value: number) => MARGIN.top + plotHeight - (value / max) * plotHeight;

  // Where the tooltip points: the top of the tallest bar in the active month, in % of the drawing.
  const tooltip =
    active === null
      ? null
      : (() => {
          const top = y(Math.max(0, ...series.map((s) => s.values[active] ?? 0)));
          return {
            left: ((MARGIN.left + band * active + band / 2) / WIDTH) * 100,
            top: (top / HEIGHT) * 100,
            // Near the top there is no room above the bar, so the tooltip opens below the point instead.
            below: top < HEIGHT * 0.4,
            // The first and last months align the tooltip to their side so it stays inside the chart.
            align: active === 0 ? "start" : active === categories.length - 1 ? "end" : "center",
          };
        })();

  const description = series
    .map(
      (s) => `${s.name}: ${categories.map((category, i) => `${category} ${formatValue(s.values[i] ?? 0)}`).join(", ")}`,
    )
    .join(". ");

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div role="region" aria-label={scrollLabel ?? label} tabIndex={0} className="overflow-x-auto">
        <div ref={chartRef} className="relative min-w-[36rem]">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-labelledby={`${id}-title ${id}-desc`}
            className="h-auto w-full"
          >
            <title id={`${id}-title`}>{label}</title>
            <desc id={`${id}-desc`}>{description}</desc>

            {Array.from({ length: TICKS + 1 }, (_, i) => {
              const value = (max / TICKS) * i;
              return (
                <g key={i}>
                  <line
                    x1={MARGIN.left}
                    x2={WIDTH - MARGIN.right}
                    y1={y(value)}
                    y2={y(value)}
                    className="stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={y(value)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted text-xs"
                  >
                    {formatLabel(value)}
                  </text>
                </g>
              );
            })}

            {categories.map((category, ci) => {
              const groupX = MARGIN.left + band * ci + (band - barWidth * series.length) / 2;
              return (
                <g key={category}>
                  {active === ci && (
                    <rect
                      x={MARGIN.left + band * ci}
                      y={MARGIN.top}
                      width={band}
                      height={plotHeight}
                      className="fill-foreground opacity-5"
                    />
                  )}
                  {series.map((s, si) => {
                    const value = s.values[ci] ?? 0;
                    const x = groupX + barWidth * si;
                    return (
                      <g key={s.name}>
                        <rect
                          x={x}
                          y={y(value)}
                          width={barWidth}
                          height={MARGIN.top + plotHeight - y(value)}
                          className={SERIES_FILL[si % SERIES_FILL.length]}
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y(value) - 6}
                          textAnchor="middle"
                          className="fill-foreground text-xs"
                        >
                          {formatLabel(value)}
                        </text>
                      </g>
                    );
                  })}
                  <text
                    x={MARGIN.left + band * ci + band / 2}
                    y={HEIGHT - MARGIN.bottom + 20}
                    textAnchor="middle"
                    className="fill-foreground text-xs"
                  >
                    {category}
                  </text>
                </g>
              );
            })}

            {/* The whole month column is the target, so short bars are as easy to hover or tap as tall ones. */}
            {categories.map((category, ci) => (
              <rect
                key={category}
                x={MARGIN.left + band * ci}
                y={MARGIN.top}
                width={band}
                height={HEIGHT - MARGIN.top}
                className="cursor-pointer fill-transparent"
                onPointerEnter={(event) => event.pointerType === "mouse" && setActive(ci)}
                onPointerLeave={(event) =>
                  event.pointerType === "mouse" && setActive((current) => (current === ci ? null : current))
                }
                onClick={(event) => {
                  // A mouse already opened it on hover; a tap toggles it.
                  if ((event.nativeEvent as PointerEvent).pointerType !== "mouse")
                    setActive((current) => (current === ci ? null : ci));
                }}
              />
            ))}
          </svg>
          {tooltip && active !== null && (
            <div
              role="status"
              className={cn(
                "pointer-events-none absolute z-10 rounded-md border border-border-strong bg-card px-3 py-2 text-sm text-foreground shadow-md [&_*]:whitespace-nowrap",
                tooltip.below ? "mt-2" : "-mt-2",
              )}
              style={{
                left: `${tooltip.left}%`,
                top: `${tooltip.top}%`,
                transform: `translate(${tooltip.align === "start" ? "-25%" : tooltip.align === "end" ? "-75%" : "-50%"}, ${tooltip.below ? "0" : "-100%"})`,
              }}
            >
              <p className="font-semibold">{categories[active]}</p>
              {series.length === 1 ? (
                <p>{formatValue(series[0].values[active] ?? 0)}</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {series.map((s, si) => (
                    <li key={s.name} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn("inline-block size-2.5 rounded-sm", SERIES_SWATCH[si % SERIES_SWATCH.length])}
                      />
                      {s.name}: {formatValue(s.values[active] ?? 0)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {series.length > 1 && (
        <figcaption>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {series.map((s, si) => (
              <li key={s.name} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("inline-block size-3 rounded-sm", SERIES_SWATCH[si % SERIES_SWATCH.length])}
                />
                {s.name}
              </li>
            ))}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}
