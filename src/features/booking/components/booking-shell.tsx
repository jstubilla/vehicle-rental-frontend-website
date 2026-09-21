"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Section, Stepper, type StepperStep } from "@/components/ui";
import { content } from "@/content";
import type { Location } from "@/types";
import { BookingLocationsContext } from "../hooks/use-locations";
import { BOOKING_STEPS } from "../steps";

const CONFIRMATION_INDEX = BOOKING_STEPS.length;

/** Frame around every booking step: the progress indicator, plus the shared pick-up locations. */
export function BookingShell({ locations, children }: { locations: Location[]; children: ReactNode }) {
  const pathname = usePathname();
  const onConfirmation = pathname.startsWith("/book/confirmation");
  const currentIndex = onConfirmation
    ? CONFIRMATION_INDEX
    : Math.max(0, BOOKING_STEPS.findIndex((step) => pathname.startsWith(step.path)));

  const steps: StepperStep[] = [
    ...BOOKING_STEPS.map((step) => ({
      id: step.id,
      label: content.booking.steps[step.id],
      // Finished steps link back, except after confirming (the booking is done).
      href: onConfirmation ? undefined : step.path,
    })),
    { id: "confirmation", label: content.booking.steps.confirmation },
  ];

  return (
    <BookingLocationsContext value={locations}>
      <Section>
        <div className="flex flex-col gap-8">
          <Stepper steps={steps} currentIndex={currentIndex} />
          {children}
        </div>
      </Section>
    </BookingLocationsContext>
  );
}
