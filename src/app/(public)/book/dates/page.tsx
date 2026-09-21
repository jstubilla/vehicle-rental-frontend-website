import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { DatesStep } from "@/features/booking/components/dates-step";
import { StepSkeleton } from "@/features/booking/components/step-parts";

export const metadata: Metadata = { title: content.booking.steps.dates };

export default function DatesPage() {
  // DatesStep reads the URL (dates and vehicle from the catalog), which needs a Suspense boundary.
  return (
    <Suspense fallback={<StepSkeleton />}>
      <DatesStep />
    </Suspense>
  );
}
