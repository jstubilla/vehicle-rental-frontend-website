/** The five steps a visitor fills in, in order. The 6th step (confirmation) is the result page. */
export const BOOKING_STEPS = [
  { id: "dates", path: "/book/dates" },
  { id: "vehicle", path: "/book/vehicle" },
  { id: "details", path: "/book/details" },
  { id: "payment", path: "/book/payment" },
  { id: "review", path: "/book/review" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

export const stepIndex = (id: BookingStepId): number => BOOKING_STEPS.findIndex((step) => step.id === id);
export const stepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id)].path;
export const nextStepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id) + 1].path;
export const previousStepPath = (id: BookingStepId): string => BOOKING_STEPS[stepIndex(id) - 1].path;
export const confirmationPath = (reference: string): string => `/book/confirmation/${reference}`;
