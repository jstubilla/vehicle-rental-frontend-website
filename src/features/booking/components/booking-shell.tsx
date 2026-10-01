"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Section, Stepper, type StepperStep } from "@/components/ui";
import { content } from "@/content";
import { BOOKING_STEPS } from "../steps";

const CONFIRMATION_INDEX = BOOKING_STEPS.length;

/** Frame around every booking step: just the progress indicator. */
export function BookingShell({ children }: { children: ReactNode }) {
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
    <Section>
      <div className="flex flex-col gap-8">
        <Stepper steps={steps} currentIndex={currentIndex} />
        {/* Keyed by route, so each step settles in as you move through the booking instead of swapping in place. */}
        <div
          key={pathname}
          className="transition-[opacity,transform] duration-(--duration-modal) ease-out-strong starting:translate-y-1.5 starting:opacity-0"
        >
          {children}
        </div>
      </div>
    </Section>
  );
}
