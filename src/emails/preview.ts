import { content } from "@/content";
import { addDaysISO, todayISO } from "@/lib/dates";
import { splitDownPayment } from "@/lib/pricing";
import type { RenderedEmail } from "./layout";
import {
  bookingConfirmedEmail,
  documentsApprovedEmail,
  documentsRejectedEmail,
  paymentReminderEmail,
  requestReceivedEmail,
  staffNewRequestEmail,
  type EmailBooking,
} from "./templates";

/** Made-up booking details for the Admin > Emails preview. Nothing here is a real customer. */
const pickupDate = addDaysISO(todayISO(), 8);
const SAMPLE: EmailBooking = {
  reference: "RC-K7M2QA",
  customerName: "Juan dela Cruz",
  vehicleName: "SUV",
  pickup: { location: "NAIA Terminal 3, Pasay", date: pickupDate, time: "10:00" },
  returnTrip: { location: "NAIA Terminal 3, Pasay", date: addDaysISO(pickupDate, 3), time: "10:00" },
  total: 12000,
  paymentDeadline: new Date(Date.now() + 24 * 3_600_000).toISOString(),
  rejectionReason: "The photo of your valid ID is blurry and the name cannot be read. Please send a clearer photo.",
};
const SAMPLE_CUSTOMER_EMAIL = "juan.delacruz@example.com";

export const EMAIL_PREVIEWS = [
  { id: "requestReceived", to: SAMPLE_CUSTOMER_EMAIL, render: () => requestReceivedEmail(SAMPLE) },
  {
    id: "staffNewRequest",
    to: content.emails.staffInbox,
    render: () => staffNewRequestEmail(SAMPLE, { bookingId: "bkg-sample" }),
  },
  { id: "documentsApproved", to: SAMPLE_CUSTOMER_EMAIL, render: () => documentsApprovedEmail(SAMPLE) },
  { id: "documentsRejected", to: SAMPLE_CUSTOMER_EMAIL, render: () => documentsRejectedEmail(SAMPLE) },
  {
    id: "bookingConfirmed",
    to: SAMPLE_CUSTOMER_EMAIL,
    render: () => bookingConfirmedEmail({ ...SAMPLE, downPayment: splitDownPayment(SAMPLE.total).downPayment }),
  },
  { id: "paymentReminder", to: SAMPLE_CUSTOMER_EMAIL, render: () => paymentReminderEmail(SAMPLE) },
] as const satisfies readonly { id: keyof typeof content.admin.emails.templates; to: string; render: () => RenderedEmail }[];

export type EmailPreviewId = (typeof EMAIL_PREVIEWS)[number]["id"];
