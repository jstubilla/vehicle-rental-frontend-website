import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Lead } from "@/types";
import { ApiError, simulateNetwork } from "./client";

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  /** Vehicle id the person asked about, or null. */
  vehicleId: string | null;
  message: string;
}

/**
 * Handles the website contact form. Every inquiry becomes a "New" lead in the CRM
 * plus an activity note, so staff see it on the dashboard.
 */
export async function submitInquiry(input: InquiryInput): Promise<{ leadId: string }> {
  await simulateNetwork();

  // DEMO ONLY: typing [fail] in the message shows the form's error state.
  if (input.message.includes("[fail]")) {
    throw new ApiError("Mock failure requested", 500);
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id: newId("lead"),
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: "website",
    stage: "new",
    vehicleInterest: input.vehicleId,
    message: input.message,
    assigneeId: null,
    customerId: null,
    createdAt: now,
    updatedAt: now,
  };
  const activity: Activity = {
    id: newId("act"),
    type: "note",
    body: `Website inquiry received: "${input.message}"`,
    entityType: "lead",
    entityId: lead.id,
    authorId: null,
    createdAt: now,
  };

  writeTable("leads", [lead, ...readTable("leads")]);
  writeTable("activities", [activity, ...readTable("activities")]);

  // EMAIL TRIGGER GOES HERE: when the real backend exists, send the notification
  // email to the company inbox (and a confirmation to input.email) at this point.

  return { leadId: lead.id };
}
