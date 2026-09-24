import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { Button } from "./button";

/** Text-only loading indicator (no animation in the wireframe). */
export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-muted", className)}>
      {label ?? content.ui.loading}
    </span>
  );
}

/** Gray block that stands in for content that is still loading. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("h-4 w-full rounded-md bg-placeholder", className)} {...props} />;
}

interface StateBoxProps {
  /** Heading level. Use "h1" when the box is the main content of a page. */
  headingAs?: "h1" | "h2" | "h3";
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Shown when a list or page has no data. */
export function EmptyState({
  headingAs: Heading = "h3",
  title = content.states.emptyTitle,
  description = content.states.emptyDescription,
  action,
  className,
}: StateBoxProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong p-8 text-center",
        className,
      )}
    >
      <Heading className="text-lg font-semibold">{title}</Heading>
      <p className="max-w-form text-sm text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Shown when loading data failed. Pass `onRetry` to show a retry button. */
export function ErrorState({
  headingAs: Heading = "h3",
  title = content.states.errorTitle,
  description = content.states.errorDescription,
  onRetry,
  action,
  className,
}: StateBoxProps & { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 border-danger p-8 text-center",
        className,
      )}
    >
      <Heading className="text-lg font-semibold">{title}</Heading>
      <p className="max-w-form text-sm text-muted">{description}</p>
      {(onRetry || action) && (
        <div className="mt-2">
          {action ?? (
            <Button variant="outline" onClick={onRetry}>
              {content.states.retry}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export type AlertVariant = "info" | "success" | "warning" | "danger";

const alertVariants: Record<AlertVariant, string> = {
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger border-2",
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: string;
}

/** Inline message. Errors use role="alert" so screen readers announce them at once. */
export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      data-surface="card"
      className={cn("rounded-md border bg-card p-4 text-foreground", alertVariants[variant], className)}
      {...props}
    >
      <p className="font-semibold">
        {title !== undefined && <span className="sr-only">{content.ui.alert[variant]}: </span>}
        {title ?? content.ui.alert[variant]}
      </p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
