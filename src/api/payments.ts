import type { OnlinePaymentMethod } from "@/lib/constants";

/**
 * ALL payment-gateway logic lives in this one file. To go live, replace the body
 * of `processPayment` with the real gateway (e.g. PayMongo, Xendit, Maya or GCash
 * checkout) and keep the same inputs and outputs.
 *
 * SECURITY: this front end must NEVER receive, hold or send card numbers, expiry
 * dates or CVVs. With a real gateway, the customer either is redirected to the
 * gateway's hosted page or types card details into the gateway's own embedded
 * fields; this code only ever sees the result. The mock below has no card data at all.
 */

export type PaymentFailureCode = "declined" | "cancelled" | "insufficient_funds";

export interface PaymentRequest {
  /** "Pay at pick-up" is never charged here; its down payment is charged with an online method. */
  method: OnlinePaymentMethod;
  /** Amount to charge in PHP. */
  amount: number;
  /** DEMO ONLY: lets the demo controls force a failed payment. A real gateway has no such input. */
  mockOutcome?: "success" | "decline";
}

export interface PaymentResult {
  method: OnlinePaymentMethod;
  amount: number;
  status: "paid" | "failed";
  /** The gateway's reference for this payment. */
  providerRef: string | null;
  failureCode: PaymentFailureCode | null;
}

const MOCK_PROCESSING_MS = 1800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  // REAL GATEWAY GOES HERE: ask your backend to create a payment session, send the
  // customer to the gateway (redirect or hosted fields), then confirm the result.
  await sleep(MOCK_PROCESSING_MS);

  if (request.mockOutcome === "decline") {
    return {
      method: request.method,
      amount: request.amount,
      status: "failed",
      providerRef: null,
      failureCode: request.method === "card" ? "declined" : "cancelled",
    };
  }

  return {
    method: request.method,
    amount: request.amount,
    status: "paid",
    providerRef: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    failureCode: null,
  };
}
