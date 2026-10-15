import { unwrap } from "./client";
import { db } from "./supabase";

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  /** Vehicle id the person asked about, or null. */
  vehicleId: string | null;
  message: string;
}

/**
 * Handles the website contact form. The database turns every inquiry into a "New" lead in the CRM plus
 * an activity note, so staff see it on the dashboard.
 */
export async function submitInquiry(input: InquiryInput): Promise<{ leadId: string }> {
  const leadId = unwrap(
    await db().rpc("submit_inquiry", {
      name: input.name,
      email: input.email,
      phone: input.phone,
      vehicle_id: input.vehicleId,
      message: input.message,
    }),
  ) as string;
  // EMAIL TRIGGER GOES HERE: send the notification email to the company inbox (and a confirmation to
  // input.email), e.g. from a Supabase database webhook on new leads.
  return { leadId };
}
