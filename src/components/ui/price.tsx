import { cn } from "@/lib/cn";
import { formatPhp, formatUsd } from "@/lib/currency";

export type PriceSize = "sm" | "md" | "lg" | "xl";

const sizes: Record<PriceSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl md:text-4xl",
};

export interface PriceProps {
  amount: number;
  size?: PriceSize;
  /** Words after the amount, e.g. "per day". */
  unit?: string;
  /** Put the USD equivalent on its own line under the PHP amount (default), inline after it, or leave it out. */
  usd?: "below" | "inline" | "none";
  /** Keep the centavos ("₱5,400.00"): for totals. Daily rates leave it off ("₱1,800"). */
  exact?: boolean;
  /** Orange price color (default) or the plain text color. */
  tone?: "price" | "plain";
  className?: string;
}

/**
 * A price: the PHP amount as the main figure, the rough USD equivalent smaller and quieter.
 * The amount and the USD text sit next to each other in the markup ("₱4,200 (~$72) per day"),
 * so the price copies and searches as one piece; the grid only moves them visually.
 */
export function Price({ amount, size = "md", unit, usd = "below", exact = false, tone = "price", className }: PriceProps) {
  const below = usd === "below";

  return (
    <span
      className={cn(
        below ? "inline-grid grid-cols-[auto_1fr] items-baseline gap-x-1.5" : "inline-flex flex-wrap items-baseline gap-x-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "font-heading font-bold tracking-tight tabular-nums",
          tone === "price" ? "text-price" : "text-foreground",
          sizes[size],
        )}
      >
        {formatPhp(amount, { exact })}
      </span>
      {usd !== "none" && (
        <>
          {" "}
          <span className={cn("text-xs text-muted tabular-nums", below && "col-span-2 row-start-2")}>
            {formatUsd(amount)}
          </span>
        </>
      )}
      {unit && (
        <>
          {" "}
          <span className={cn("text-sm text-muted", below && "col-start-2 row-start-1")}>{unit}</span>
        </>
      )}
    </span>
  );
}
