import { searchCustomers, type CustomerListParams, type CustomerRow } from "@/lib/customer-search";
import { sessionCan } from "@/lib/session";
import { newId, readTable, writeTable } from "@/mocks/store";
import type { Booking, Customer, Paginated } from "@/types";
import { assertCan } from "./auth";
import { ApiError, simulateNetwork } from "./client";

export async function listCustomers(params: CustomerListParams): Promise<Paginated<CustomerRow>> {
  assertCan("customers.view");
  await simulateNetwork();
  const bookings = readTable("bookings");
  const rows: CustomerRow[] = readTable("customers").map((customer) => ({
    ...customer,
    bookingCount: bookings.filter((b) => b.customerId === customer.id).length,
  }));
  return searchCustomers(rows, params);
}

export interface CustomerProfile {
  customer: Customer;
  /** Empty unless the signed-in role may view bookings. */
  bookings: { booking: Booking; vehicleName: string }[];
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const session = assertCan("customers.view");
  await simulateNetwork();
  const customer = readTable("customers").find((c) => c.id === id);
  if (!customer) return null;

  const vehicles = readTable("vehicles");
  const bookings = sessionCan(session, "bookings.view")
    ? readTable("bookings")
        .filter((b) => b.customerId === id)
        .sort((a, b) => b.pickupDate.localeCompare(a.pickupDate))
        .map((booking) => ({
          booking,
          vehicleName: vehicles.find((v) => v.id === booking.vehicleId)?.name ?? "",
        }))
    : [];
  return { customer, bookings };
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  notes: string;
}

function assertEmailFree(customers: Customer[], email: string, exceptId?: string) {
  const taken = customers.some((c) => c.id !== exceptId && c.email.toLowerCase() === email.toLowerCase());
  if (taken) throw new ApiError("A customer with this email already exists", 409, "duplicate_email");
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const session = assertCan("customers.edit");
  await simulateNetwork();

  const customers = readTable("customers");
  const email = input.email.trim().toLowerCase();
  assertEmailFree(customers, email);

  const now = new Date().toISOString();
  const customer: Customer = {
    id: newId("cus"),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    licenseNumber: input.licenseNumber.trim() || null,
    notes: input.notes.trim(),
    additionalContacts: [],
    createdAt: now,
  };
  writeTable("customers", [customer, ...customers]);
  writeTable("activities", [
    {
      id: newId("act"),
      type: "note",
      body: "Customer added by staff.",
      entityType: "customer",
      entityId: customer.id,
      authorId: session.userId,
      createdAt: now,
    },
    ...readTable("activities"),
  ]);
  return customer;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  assertCan("customers.edit");
  await simulateNetwork();

  const customers = readTable("customers");
  const existing = customers.find((c) => c.id === id);
  if (!existing) throw new ApiError("Customer not found", 404, "not_found");

  const email = input.email.trim().toLowerCase();
  assertEmailFree(customers, email, id);

  const updated: Customer = {
    ...existing,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    licenseNumber: input.licenseNumber.trim() || null,
    notes: input.notes.trim(),
  };
  writeTable("customers", customers.map((c) => (c.id === id ? updated : c)));
  return updated;
}

/** Deletes a customer and their activity log. Customers with bookings are kept. */
export async function deleteCustomer(id: string): Promise<void> {
  assertCan("customers.edit");
  await simulateNetwork();

  if (readTable("bookings").some((b) => b.customerId === id)) {
    throw new ApiError("This customer has bookings", 409, "has_bookings");
  }
  writeTable("customers", readTable("customers").filter((c) => c.id !== id));
  writeTable("activities", readTable("activities").filter((a) => !(a.entityType === "customer" && a.entityId === id)));
  // Leads that were converted into this customer simply lose the link.
  writeTable("leads", readTable("leads").map((l) => (l.customerId === id ? { ...l, customerId: null } : l)));
}
