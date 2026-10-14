import { content } from "@/content";
import type { LeadSource, LeadStage } from "@/lib/constants";
import { searchLeads, type LeadListParams, type LeadRow as LeadListRow } from "@/lib/lead-search";
import type { Lead, Paginated } from "@/types";
import { requireStaff } from "./auth";
import { ApiError, check, toApiError, unwrap } from "./client";
import { toLead, type LeadRow } from "./rows";
import { db } from "./supabase";

// Leads reach customers and staff in more than one way (directly, and through tasks or activities),
// so the embeds name the exact foreign key.
const LIST_SELECT = "*, contact_details(*), vehicle:vehicles!leads_vehicle_interest_fkey(name), assignee:staff!leads_assignee_id_fkey(name)";

type LeadWithNames = LeadRow & { vehicle: { name: string } | null; assignee: { name: string } | null };

async function loadLeadRows(): Promise<LeadListRow[]> {
  const rows = unwrap(await db().from("leads").select(LIST_SELECT)) as LeadWithNames[];
  return rows.map(({ vehicle, assignee, ...row }) => ({
    ...toLead(row),
    vehicleName: vehicle?.name ?? null,
    assigneeName: assignee?.name ?? null,
  }));
}

export async function listLeads(params: LeadListParams): Promise<Paginated<LeadListRow>> {
  await requireStaff();
  return searchLeads(await loadLeadRows(), params);
}

/** Every lead, newest first, for the pipeline board (which shows them all at once). */
export async function listPipelineLeads(): Promise<LeadListRow[]> {
  await requireStaff();
  return (await loadLeadRows()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface LeadDetail {
  lead: Lead;
  vehicle: { name: string; slug: string } | null;
  assigneeName: string | null;
  customer: { id: string; name: string } | null;
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await requireStaff();
  const { data, error } = await db()
    .from("leads")
    .select(
      "*, contact_details(*), vehicle:vehicles!leads_vehicle_interest_fkey(name, slug), assignee:staff!leads_assignee_id_fkey(name), customer:customers!leads_customer_id_fkey(id, name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!data) return null;
  const { vehicle, assignee, customer, ...row } = data as LeadRow & {
    vehicle: { name: string; slug: string } | null;
    assignee: { name: string } | null;
    customer: { id: string; name: string } | null;
  };
  return { lead: toLead(row), vehicle, assigneeName: assignee?.name ?? null, customer };
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  vehicleInterest: string | null;
  assigneeId: string | null;
  message: string;
}

const toColumns = (input: Omit<LeadInput, "stage">) => ({
  name: input.name.trim(),
  email: input.email.trim().toLowerCase(),
  phone: input.phone.trim(),
  source: input.source,
  vehicle_interest: input.vehicleInterest,
  assignee_id: input.assigneeId,
  message: input.message.trim(),
});

async function addLeadNotes(...notes: { lead_id?: string; customer_id?: string; type: "note" | "status_change"; body: string; author_id: string }[]) {
  check(await db().from("activities").insert(notes));
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { userId } = await requireStaff();
  const row = unwrap(await db().from("leads").insert({ ...toColumns(input), stage: input.stage }).select("*").single()) as LeadRow;
  await addLeadNotes({ lead_id: row.id, type: "note", body: content.admin.leads.createdNote, author_id: userId });
  return toLead(row);
}

/** Edits a lead's details. The stage is changed with changeLeadStage so the change is logged. */
export async function updateLead(id: string, input: Omit<LeadInput, "stage">): Promise<Lead> {
  await requireStaff();
  const { data, error } = await db().from("leads").update(toColumns(input)).eq("id", id).select("*, contact_details(*)").maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("Lead not found", 404, "not_found");
  return toLead(data as LeadRow);
}

async function loadLead(id: string): Promise<LeadRow> {
  const { data, error } = await db().from("leads").select("*, contact_details(*)").eq("id", id).maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("Lead not found", 404, "not_found");
  return data as LeadRow;
}

export async function changeLeadStage(id: string, stage: LeadStage): Promise<Lead> {
  const { userId } = await requireStaff();
  const existing = await loadLead(id);
  if (existing.stage === stage) return toLead(existing);

  const row = unwrap(await db().from("leads").update({ stage }).eq("id", id).select("*").single()) as LeadRow;
  await addLeadNotes({
    lead_id: id,
    type: "status_change",
    body: content.admin.leads.stageChangeNote(content.enums.leadStage[existing.stage], content.enums.leadStage[stage]),
    author_id: userId,
  });
  return toLead(row);
}

/**
 * Turns a lead into a customer and marks the lead as Won. If a customer with the same email already
 * exists, the lead is linked to them instead of making a duplicate. The lead's extra phone numbers
 * and emails are copied to a new customer.
 */
export async function convertLeadToCustomer(id: string): Promise<{ customerId: string }> {
  const { userId } = await requireStaff();
  const lead = toLead(await loadLead(id));
  const supabase = db();

  let customerId: string | null = null;
  if (lead.email) {
    const { data } = await supabase.from("customers").select("id").eq("email", lead.email.toLowerCase()).maybeSingle();
    customerId = data?.id ?? null;
  }
  if (!customerId) {
    if (!lead.email) throw new ApiError("Add an email to the lead before converting it", 400, "invalid_input");
    const created = unwrap(
      await supabase
        .from("customers")
        .insert({ name: lead.name, email: lead.email, phone: lead.phone, notes: lead.message })
        .select("id")
        .single(),
    ) as { id: string };
    customerId = created.id;
    if (lead.additionalContacts.length > 0) {
      check(
        await supabase.from("contact_details").insert(
          lead.additionalContacts.map(({ type, value, label }) => ({ type, value, label, customer_id: customerId })),
        ),
      );
    }
  }

  check(await supabase.from("leads").update({ stage: "won", customer_id: customerId }).eq("id", id));

  const notes: Parameters<typeof addLeadNotes> = [];
  if (lead.stage !== "won") {
    notes.push({
      lead_id: id,
      type: "status_change",
      body: content.admin.leads.stageChangeNote(content.enums.leadStage[lead.stage], content.enums.leadStage.won),
      author_id: userId,
    });
  }
  notes.push(
    { lead_id: id, type: "note", body: content.admin.leads.convertNote, author_id: userId },
    { customer_id: customerId, type: "note", body: `Created from lead ${lead.name}.`, author_id: userId },
  );
  await addLeadNotes(...notes);
  return { customerId };
}

/** Deletes a lead with its activity log and extra contact details. */
export async function deleteLead(id: string): Promise<void> {
  await requireStaff();
  check(await db().from("leads").delete().eq("id", id));
}
