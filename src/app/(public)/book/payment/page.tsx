import type { Metadata } from "next";
import { content } from "@/content";
import { PaymentStep } from "@/features/booking/components/payment-step";

export const metadata: Metadata = { title: content.booking.steps.payment };

export default function PaymentPage() {
  return <PaymentStep />;
}
