import type { ContactType } from "@/lib/constants";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { ContactDetail } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

/** Extra phone numbers and emails on a customer or a lead. */
export type ContactOwner = "customer" | "lead";

export interface ContactDetailInput {
  type: ContactType;
  label: string;
  value: string;
}

type WithContacts = { id: string; additionalContacts: ContactDetail[] };

function changeRow<T extends WithContacts>(rows: T[], id: string, change: (list: ContactDetail[]) => ContactDetail[]): T[] {
  if (!rows.some((row) => row.id === id)) throw new ApiError("Record not found", 404, "not_found");
  return rows.map((row) => (row.id === id ? { ...row, additionalContacts: change(row.additionalContacts) } : row));
}

async function change(owner: ContactOwner, id: string, edit: (list: ContactDetail[]) => ContactDetail[]) {
  assertCan(owner === "customer" ? "customers.edit" : "leads.edit");
  await simulateNetwork();
  if (owner === "customer") writeTable("customers", changeRow(readTable("customers"), id, edit));
  else writeTable("leads", changeRow(readTable("leads"), id, edit));
}

const clean = (input: ContactDetailInput) => ({
  type: input.type,
  label: input.label.trim(),
  value: input.value.trim(),
});

export function addContactDetail(owner: ContactOwner, id: string, input: ContactDetailInput) {
  return change(owner, id, (list) => [...list, { id: newId("cd"), ...clean(input) }]);
}

export function updateContactDetail(owner: ContactOwner, id: string, detailId: string, input: ContactDetailInput) {
  return change(owner, id, (list) => list.map((d) => (d.id === detailId ? { ...d, ...clean(input) } : d)));
}

export function removeContactDetail(owner: ContactOwner, id: string, detailId: string) {
  return change(owner, id, (list) => list.filter((d) => d.id !== detailId));
}
