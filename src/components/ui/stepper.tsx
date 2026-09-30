import Link from "next/link";
import { cn } from "@/lib/cn";
import { content } from "@/content";

export interface StepperStep {
  id: string;
  label: string;
  /** If set, completed steps become links so people can go back. */
  href?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the current step. */
  currentIndex: number;
  className?: string;
}

/**
 * Step indicator for the booking flow. Purely presentational. Below `sm` (where a full chip row
 * would wrap into several ragged lines), it collapses to a "Step X of Y: Label" line and a segmented
 * progress bar instead; `sm` and up show the full row of numbered steps.
 */
export function Stepper({ steps, currentIndex, className }: StepperProps) {
  const t = content.ui.stepper;
  const current = steps[currentIndex];

  return (
    <nav aria-label={t.label} className={className}>
      {current && (
        <div className="sm:hidden">
          <p className="mb-2 text-sm font-medium text-foreground">
            {t.step} {currentIndex + 1} {t.of} {steps.length}: {current.label}
          </p>
          <div className="flex gap-1" role="img" aria-label={`${t.step} ${currentIndex + 1} ${t.of} ${steps.length}`}>
            {steps.map((step, index) => (
              <span
                key={step.id}
                aria-hidden="true"
                className={cn("h-1.5 flex-1 rounded-full", index <= currentIndex ? "bg-primary" : "bg-surface-muted")}
              />
            ))}
          </div>
        </div>
      )}

      <ol className="hidden flex-wrap gap-x-4 gap-y-2 sm:flex">
        {steps.map((step, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          const body = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border text-sm font-medium",
                  state === "todo" && "border-border-strong text-muted",
                  state === "current" && "border-primary bg-primary text-primary-foreground",
                  state === "done" && "border-primary text-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className={cn("text-sm", state === "current" ? "font-semibold" : "text-muted")}>
                {step.label}
              </span>
              {state === "done" && <span className="sr-only">({t.complete})</span>}
            </>
          );

          return (
            <li
              key={step.id}
              aria-current={state === "current" ? "step" : undefined}
              className="flex items-center gap-2"
            >
              {state === "done" && step.href ? (
                <Link href={step.href} className="flex items-center gap-2 no-underline">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
