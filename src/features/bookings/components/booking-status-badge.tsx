import { Badge, type BadgeVariant } from "@/components/ui";
import { content } from "@/content";
import type { BookingStatus, PaymentStatus } from "@/lib/constants";
import { BOOKING_STATUS_BADGE } from "../status-style";

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, BadgeVariant> = {
  paid: "success",
  pending: "warning",
  processing: "info",
  failed: "danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={BOOKING_STATUS_BADGE[status]}>{content.enums.bookingStatus[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_STATUS_BADGE[status]}>{content.enums.paymentStatus[status]}</Badge>;
}
