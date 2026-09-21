"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_STEPS, stepIndex, stepPath, type BookingStepId } from "../steps";
import type { FlowState } from "../flow-store";
import { useBookingFlow } from "./use-booking-flow";

/** A successful payment (or pay-at-pick-up) for the current total. */
export function isPaymentValid(state: FlowState, total?: number | null): boolean {
  const payment = state.payment;
  if (!payment || payment.status === "failed") return false;
  return total == null || payment.amount === total;
}

function isStepDone(id: BookingStepId, state: FlowState, total?: number | null): boolean {
  switch (id) {
    case "dates":
      return state.rental !== null;
    case "vehicle":
      return state.vehicleSlug !== null;
    case "details":
      return state.customer !== null;
    case "payment":
      return isPaymentValid(state, total);
    default:
      return true;
  }
}

/**
 * Sends the visitor back to the first step they have not completed, so nobody can
 * jump ahead (e.g. open /book/review straight away). `ready` is true when the page may render.
 */
export function useStepGuard(step: BookingStepId, total?: number | null) {
  const router = useRouter();
  const { state, hydrated } = useBookingFlow();

  const firstUnmet = hydrated
    ? BOOKING_STEPS.slice(0, stepIndex(step)).find((s) => !isStepDone(s.id, state, total))
    : undefined;

  useEffect(() => {
    if (firstUnmet) router.replace(stepPath(firstUnmet.id));
  }, [firstUnmet, router]);

  return { ready: hydrated && !firstUnmet, state };
}
