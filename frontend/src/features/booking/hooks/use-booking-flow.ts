"use client";

import { useSyncExternalStore } from "react";
import {
  getFlowServerSnapshot,
  getFlowSnapshot,
  resetFlow,
  subscribeFlow,
  updateFlow,
} from "../flow-store";

const subscribeNothing = () => () => {};

/**
 * The booking in progress. `hydrated` is false while the server renders and during
 * the first browser render, because the saved booking is only readable in the browser.
 */
export function useBookingFlow() {
  const state = useSyncExternalStore(subscribeFlow, getFlowSnapshot, getFlowServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  return { state, hydrated, update: updateFlow, reset: resetFlow };
}
