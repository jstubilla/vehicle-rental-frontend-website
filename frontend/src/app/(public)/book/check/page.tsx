import type { Metadata } from "next";
import { content } from "@/content";
import { CheckStep } from "@/features/booking/components/check-step";

export const metadata: Metadata = { title: content.booking.steps.check };

export default function CheckPage() {
  return <CheckStep />;
}
