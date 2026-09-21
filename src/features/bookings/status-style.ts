import type { BadgeVariant } from "@/components/ui";
import type { BookingStatus } from "@/lib/constants";

/** How each booking status is shown as a badge. The one place to change it. */
export const BOOKING_STATUS_BADGE: Record<BookingStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "success",
  active: "info",
  completed: "neutral",
  cancelled: "danger",
};
