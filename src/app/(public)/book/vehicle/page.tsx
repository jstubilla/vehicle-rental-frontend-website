import type { Metadata } from "next";
import { content } from "@/content";
import { VehicleStep } from "@/features/booking/components/vehicle-step";

export const metadata: Metadata = { title: content.booking.steps.vehicle };

export default function VehiclePage() {
  return <VehicleStep />;
}
