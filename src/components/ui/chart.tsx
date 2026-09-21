import { useId } from "react";
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
 */
export function BarChart({ label, categories, series, formatValue = String, scrollLabel, className }: BarChartProps) {
  const id = useId();
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const band = plotWidth / Math.max(categories.length, 1);
  const barWidth = (band * 0.7) / Math.max(series.length, 1);
  const y = (value: number) => MARGIN.top + plotHeight - (value / max) * plotHeight;

  const description = series
    .map((s) => `${s.name}: ${categories.map((category, i) => `${category} ${formatValue(s.values[i] ?? 0)}`).join(", ")}`)
    .join(". ");

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div role="region" aria-label={scrollLabel ?? label} tabIndex={0} className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
          className="h-auto w-full min-w-[36rem]"
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
                <text x={MARGIN.left - 8} y={y(value)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-xs">
                  {formatValue(value)}
                </text>
              </g>
            );
          })}

          {categories.map((category, ci) => {
            const groupX = MARGIN.left + band * ci + (band - barWidth * series.length) / 2;
            return (
              <g key={category}>
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
                      <text x={x + barWidth / 2} y={y(value) - 6} textAnchor="middle" className="fill-foreground text-xs">
                        {formatValue(value)}
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
        </svg>
      </div>

      {series.length > 1 && (
        <figcaption>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {series.map((s, si) => (
              <li key={s.name} className="flex items-center gap-2">
                <span aria-hidden="true" className={cn("inline-block size-3 rounded-sm", SERIES_SWATCH[si % SERIES_SWATCH.length])} />
                {s.name}
              </li>
            ))}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}
