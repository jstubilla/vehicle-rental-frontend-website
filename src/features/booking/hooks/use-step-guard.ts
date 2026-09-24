"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_STEPS, stepIndex, stepPath, type BookingStepId } from "../steps";
import type { FlowState } from "../flow-store";
import { useBookingFlow } from "./use-booking-flow";

function isStepDone(id: BookingStepId, state: FlowState): boolean {
  switch (id) {
    case "dates":
      return state.rental !== null;
    case "vehicle":
      return state.vehicleSlug !== null;
    case "details":
      return state.customer !== null;
    default:
      return true;
  }
}

/**
 * Sends the visitor back to the first step they have not completed, so nobody can
 * jump ahead (e.g. open /book/check straight away). `ready` is true when the page may render.
 */
export function useStepGuard(step: BookingStepId) {
  const router = useRouter();
  const { state, hydrated } = useBookingFlow();

  const firstUnmet = hydrated
    ? BOOKING_STEPS.slice(0, stepIndex(step)).find((s) => !isStepDone(s.id, state))
    : undefined;

  useEffect(() => {
    if (firstUnmet) router.replace(stepPath(firstUnmet.id));
  }, [firstUnmet, router]);

  return { ready: hydrated && !firstUnmet, state };
}
