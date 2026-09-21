"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { processPayment, type PaymentRequest, type PaymentResult } from "@/api/payments";
import type { PaymentMethod } from "@/lib/constants";
import { isPaymentValid } from "./use-step-guard";
import { useBookingFlow } from "./use-booking-flow";

export type PaymentStatusView = "idle" | "processing" | "paid" | "pending" | "failed";

/** Step 4: choose a method and pay. `total` is what the customer owes right now. */
export function usePaymentStep(total: number | null) {
  const { state, update } = useBookingFlow();

  // A payment already made for this exact total (e.g. the visitor came back to this step).
  const existing = isPaymentValid(state, total) ? state.payment : null;

  const [chosenMethod, setChosenMethod] = useState<PaymentMethod | null>(null);
  const [mockOutcome, setMockOutcome] = useState<"success" | "decline">("success");

  const mutation = useMutation({
    mutationFn: (request: PaymentRequest) => processPayment(request),
    onSuccess: (result: PaymentResult) => update({ payment: result.status === "failed" ? null : result }),
  });

  const result = mutation.data ?? existing;
  const method = chosenMethod ?? existing?.method ?? "card";
  const status: PaymentStatusView = mutation.isPending ? "processing" : (result?.status ?? "idle");

  return {
    method,
    /** Picking another method clears a failed attempt so the visitor can try again. */
    selectMethod: (next: PaymentMethod) => {
      setChosenMethod(next);
      mutation.reset();
    },
    mockOutcome,
    setMockOutcome,
    result,
    status,
    pay: () => {
      if (total !== null) mutation.mutate({ method, amount: total, mockOutcome });
    },
    /** After a successful payment, go back and pick a different method. */
    changeMethod: () => {
      mutation.reset();
      update({ payment: null });
    },
  };
}
