import type { Metadata } from "next";
import { content } from "@/content";
import { SubmitStep } from "@/features/booking/components/submit-step";

export const metadata: Metadata = { title: content.booking.steps.submit };

export default function SubmitPage() {
  return <SubmitStep />;
}
