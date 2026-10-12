/** The five steps a visitor goes through, in order. The last one sends the booking request (nothing is paid yet). The 6th step (confirmation) is the result page. */
export const BOOKING_STEPS = [
  { id: "dates", path: "/book/dates" },
  { id: "vehicle", path: "/book/vehicle" },
  { id: "details", path: "/book/details" },
  { id: "check", path: "/book/check" },
  { id: "submit", path: "/book/submit" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

export const stepIndex = (id: BookingStepId): number => BOOKING_STEPS.findIndex((step) => step.id === id);
export const stepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id)].path;
export const nextStepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id) + 1].path;
export const previousStepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id) - 1].path;
export const confirmationPath = (reference: string): string => `/book/confirmation/${reference}`;
