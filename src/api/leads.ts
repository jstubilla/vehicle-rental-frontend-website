import { content } from "@/content";
import type { LeadSource, LeadStage } from "@/lib/constants";
import { searchLeads, type LeadListParams, type LeadRow } from "@/lib/lead-search";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Activity, Customer, Lead, Paginated } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

function toLeadRows(): LeadRow[] {
  const vehicles = readTable("vehicles");
  const users = readTable("users");
  return readTable("leads").map((lead) => ({
    ...lead,
    vehicleName: vehicles.find((v) => v.id === lead.vehicleInterest)?.name ?? null,
    assigneeName: users.find((u) => u.id === lead.assigneeId)?.name ?? null,
  }));
}

export async function listLeads(params: LeadListParams): Promise<Paginated<LeadRow>> {
  assertCan("leads.view");
  await simulateNetwork();
  return searchLeads(toLeadRows(), params);
}

/** Every lead, newest first, for the pipeline board (which shows them all at once). */
export async function listPipelineLeads(): Promise<LeadRow[]> {
  assertCan("leads.view");
  await simulateNetwork();
  return toLeadRows().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface LeadDetail {
  lead: Lead;
  vehicle: { name: string; slug: string } | null;
  assigneeName: string | null;
  customer: { id: string; name: string } | null;
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  assertCan("leads.view");
  await simulateNetwork();
  const lead = readTable("leads").find((l) => l.id === id);
  if (!lead) return null;

  const vehicle = readTable("vehicles").find((v) => v.id === lead.vehicleInterest);
  const customer = readTable("customers").find((c) => c.id === lead.customerId);
  return {
    lead,
    vehicle: vehicle ? { name: vehicle.name, slug: vehicle.slug } : null,
    assigneeName: readTable("users").find((u) => u.id === lead.assigneeId)?.name ?? null,
    customer: customer ? { id: customer.id, name: customer.name } : null,
  };
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

const activity = (
  lead: string,
  type: Activity["type"],
  body: string,
  authorId: string,
  createdAt: string,
): Activity => ({ id: newId("act"), type, body, entityType: "lead", entityId: lead, authorId, createdAt });

function addActivities(...items: Activity[]) {
  writeTable("activities", [...items, ...readTable("activities")]);
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const session = assertCan("leads.edit");
  await simulateNetwork();

  const now = new Date().toISOString();
  const lead: Lead = {
    id: newId("lead"),
    ...input,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    message: input.message.trim(),
    additionalContacts: [],
    customerId: null,
    createdAt: now,
    updatedAt: now,
  };
  writeTable("leads", [lead, ...readTable("leads")]);
  addActivities(activity(lead.id, "note", content.admin.leads.createdNote, session.userId, now));
  return lead;
}

/** Edits a lead's details. The stage is changed with changeLeadStage so the change is logged. */
export async function updateLead(id: string, input: Omit<LeadInput, "stage">): Promise<Lead> {
  assertCan("leads.edit");
  await simulateNetwork();

  const leads = readTable("leads");
  const existing = leads.find((l) => l.id === id);
  if (!existing) throw new ApiError("Lead not found", 404, "not_found");

  const updated: Lead = {
    ...existing,
    ...input,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    message: input.message.trim(),
    updatedAt: new Date().toISOString(),
  };
  writeTable("leads", leads.map((l) => (l.id === id ? updated : l)));
  return updated;
}

export async function changeLeadStage(id: string, stage: LeadStage): Promise<Lead> {
  const session = assertCan("leads.edit");
  await simulateNetwork();

  const leads = readTable("leads");
  const existing = leads.find((l) => l.id === id);
  if (!existing) throw new ApiError("Lead not found", 404, "not_found");
  if (existing.stage === stage) return existing;

  const now = new Date().toISOString();
  const updated: Lead = { ...existing, stage, updatedAt: now };
  writeTable("leads", leads.map((l) => (l.id === id ? updated : l)));
  addActivities(
    activity(
      id,
      "status_change",
      content.admin.leads.stageChangeNote(content.enums.leadStage[existing.stage], content.enums.leadStage[stage]),
      session.userId,
      now,
    ),
  );
  return updated;
}

/**
 * Turns a lead into a customer and marks the lead as Won. If a customer with the
 * same email already exists, the lead is linked to them instead of making a duplicate.
 */
export async function convertLeadToCustomer(id: string): Promise<{ customerId: string }> {
  const session = assertCan("leads.edit");
  assertCan("customers.edit");
  await simulateNetwork();

  const leads = readTable("leads");
  const lead = leads.find((l) => l.id === id);
  if (!lead) throw new ApiError("Lead not found", 404, "not_found");

  const now = new Date().toISOString();
  const customers = readTable("customers");
  let customer: Customer | undefined = lead.email
    ? customers.find((c) => c.email.toLowerCase() === lead.email.toLowerCase())
    : undefined;

  if (!customer) {
    customer = {
      id: newId("cus"),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      licenseNumber: null,
      notes: lead.message,
      additionalContacts: lead.additionalContacts,
      createdAt: now,
    };
    writeTable("customers", [customer, ...customers]);
  }

  const wasWon = lead.stage === "won";
  writeTable("leads", leads.map((l) => (l.id === id ? { ...l, stage: "won", customerId: customer!.id, updatedAt: now } : l)));

  const entries = [
    activity(id, "note", content.admin.leads.convertNote, session.userId, now),
    {
      ...activity(customer.id, "note", `Created from lead ${lead.name}.`, session.userId, now),
      entityType: "customer" as const,
    },
  ];
  if (!wasWon) {
    entries.unshift(
      activity(
        id,
        "status_change",
        content.admin.leads.stageChangeNote(content.enums.leadStage[lead.stage], content.enums.leadStage.won),
        session.userId,
        now,
      ),
    );
  }
  addActivities(...entries);
  return { customerId: customer.id };
}

export async function deleteLead(id: string): Promise<void> {
  assertCan("leads.edit");
  await simulateNetwork();
  writeTable("leads", readTable("leads").filter((l) => l.id !== id));
  writeTable("activities", readTable("activities").filter((a) => !(a.entityType === "lead" && a.entityId === id)));
}
