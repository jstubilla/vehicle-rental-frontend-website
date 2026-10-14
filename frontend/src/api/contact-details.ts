import type { ContactType } from "@/lib/constants";
import { requireStaff } from "./auth";
import { check } from "./client";
import { db } from "./supabase";

/** Extra phone numbers and emails on a customer or a lead (the contact_details table). */
export type ContactOwner = "customer" | "lead";

export interface ContactDetailInput {
  type: ContactType;
  label: string;
  value: string;
}

const clean = (input: ContactDetailInput) => ({
  type: input.type,
  label: input.label.trim(),
  value: input.value.trim(),
});

const ownerColumn = (owner: ContactOwner) => (owner === "customer" ? "customer_id" : "lead_id");

export async function addContactDetail(owner: ContactOwner, id: string, input: ContactDetailInput): Promise<void> {
  await requireStaff();
  check(await db().from("contact_details").insert({ ...clean(input), [ownerColumn(owner)]: id }));
}

export async function updateContactDetail(owner: ContactOwner, id: string, detailId: string, input: ContactDetailInput): Promise<void> {
  await requireStaff();
  check(await db().from("contact_details").update(clean(input)).eq("id", detailId).eq(ownerColumn(owner), id));
}

export async function removeContactDetail(owner: ContactOwner, id: string, detailId: string): Promise<void> {
  await requireStaff();
  check(await db().from("contact_details").delete().eq("id", detailId).eq(ownerColumn(owner), id));
}
