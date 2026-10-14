import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { ApiErrorCode } from "@/api/client";
import { toApiError } from "@/api/client";
import { processPayment } from "@/api/payments";
import { adminClient } from "@/api/server";
import { isPaymentOverdue } from "@/lib/booking-status";
import { ONLINE_PAYMENT_METHODS, PAYMENT_METHODS } from "@/lib/constants";
import { splitDownPayment } from "@/lib/pricing";
import { SHOW_MOCK_CONTROLS } from "@/lib/site";

/**
 * Pays for a booking whose documents staff have approved (called by payForBooking in src/api/bookings.ts).
 * Order: check the booking, take the payment, record it. Recording uses the service-role key, which
 * only this server has; the database re-checks the booking and works out the amounts itself.
 */
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  reference: z.string().min(1),
  email: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  downPaymentMethod: z.enum(ONLINE_PAYMENT_METHODS).optional(),
  mockOutcome: z.enum(["success", "decline"]).optional(),
});

function fail(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid payment request", 400, "invalid_input");
  const input = parsed.data;
  const supabase = adminClient();

  // The booking must be the visitor's own (reference + email), approved and not overdue.
  const found = await supabase.rpc("get_own_booking", { reference: input.reference, email: input.email });
  if (found.error) {
    const error = toApiError(found.error);
    return fail(error.message, error.status, error.code);
  }
  const booking = found.data.booking as { id: string; status: string; total: number; approved_at: string | null };
  if (booking.status !== "approved") return fail("This booking cannot be paid", 409, "not_payable");
  if (isPaymentOverdue({ approvedAt: booking.approved_at })) {
    return fail("The payment deadline has passed", 409, "payment_overdue");
  }

  // Pay at pick-up: only the down payment is charged now; the balance is paid at pick-up.
  const payAtPickup = input.method === "pay_at_pickup";
  const downPaymentMethod = input.downPaymentMethod ?? "card";
  const payment = await processPayment({
    method: payAtPickup ? downPaymentMethod : (input.method as (typeof ONLINE_PAYMENT_METHODS)[number]),
    amount: payAtPickup ? splitDownPayment(booking.total).downPayment : booking.total,
    // DEMO ONLY: the "force a decline" control. A real gateway has no such input.
    mockOutcome: SHOW_MOCK_CONTROLS ? input.mockOutcome : undefined,
  });
  if (payment.status === "failed") {
    return NextResponse.json({ status: "payment_failed", failureCode: payment.failureCode ?? "declined" });
  }

  const recorded = await supabase.rpc("record_booking_payment", {
    booking_id: booking.id,
    method: input.method,
    provider_ref: payment.providerRef,
    down_payment_method: payAtPickup ? downPaymentMethod : null,
  });
  if (recorded.error) {
    // The charge went through but could not be recorded: with a real gateway, refund or flag it here.
    console.error("Payment taken but not recorded", { reference: input.reference, providerRef: payment.providerRef, error: recorded.error });
    const error = toApiError(recorded.error);
    return fail(error.message, error.status, error.code);
  }
  // EMAIL TRIGGER GOES HERE: send bookingConfirmedEmail to the customer (/src/emails).
  return NextResponse.json({ status: "paid", booking: recorded.data });
}
