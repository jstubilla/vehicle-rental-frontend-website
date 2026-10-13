import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Skeleton } from "@/components/ui";
import { content } from "@/content";

/** Title and intro line at the top of every step. */
export function StepHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1>{title}</h1>
      {description && <p className="text-lg text-muted">{description}</p>}
    </div>
  );
}

/** Back button on the left, main action(s) on the right. */
export function StepActions({ backHref, children }: { backHref?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      {backHref ? (
        <Button asChild variant="outline">
          <Link href={backHref}>{content.booking.common.back}</Link>
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Shown while the saved booking is being read from the browser. */
export function StepSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label={content.booking.common.loading}>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-40" />
    </div>
  );
}
