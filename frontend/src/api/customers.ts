import { searchCustomers, type CustomerListParams, type CustomerRow as CustomerListRow } from "@/lib/customer-search";
import type { Booking, Customer, Paginated } from "@/types";
import { requireStaff } from "./auth";
import { ApiError, check, toApiError, unwrap } from "./client";
import { one, toBooking, toCustomer, type BookingRow, type CustomerRow } from "./rows";
import { db } from "./supabase";

export async function listCustomers(params: CustomerListParams): Promise<Paginated<CustomerListRow>> {
  await requireStaff();
  const rows = unwrap(await db().from("customers").select("*, contact_details(*), bookings(count)")) as (CustomerRow & {
    bookings: { count: number }[] | { count: number } | null;
  })[];
  return searchCustomers(
    rows.map(({ bookings, ...row }) => ({ ...toCustomer(row), bookingCount: one(bookings)?.count ?? 0 })),
    params,
  );
}

export interface CustomerProfile {
  customer: Customer;
  bookings: { booking: Booking; vehicleName: string }[];
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  await requireStaff();
  const { data, error } = await db()
    .from("customers")
    .select("*, contact_details(*), bookings(*, vehicle:vehicles(name), payment:payments(id))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!data) return null;
  const { bookings, ...customer } = data as CustomerRow & {
    bookings: (BookingRow & { vehicle: { name: string } | null; payment: { id: string } | { id: string }[] | null })[];
  };
  return {
    customer: toCustomer(customer),
    bookings: bookings
      .map(({ vehicle, payment, ...booking }) => ({
        booking: toBooking(booking, one(payment)?.id ?? null),
        vehicleName: vehicle?.name ?? "",
      }))
      .sort((a, b) => b.booking.pickupDate.localeCompare(a.booking.pickupDate)),
  };
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  notes: string;
}

const toColumns = (input: CustomerInput) => ({
  name: input.name.trim(),
  email: input.email.trim().toLowerCase(),
  phone: input.phone.trim(),
  license_number: input.licenseNumber.trim() || null,
  notes: input.notes.trim(),
});

/** A unique-email error from the database means another customer has this email. */
function duplicateEmail(error: ApiError): ApiError {
  return error.code === "duplicate_email" ? new ApiError("A customer with this email already exists", 409, "duplicate_email") : error;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { userId } = await requireStaff();
  const result = await db().from("customers").insert(toColumns(input)).select("*").single();
  if (result.error) throw duplicateEmail(toApiError(result.error));
  const customer = toCustomer(result.data as CustomerRow);
  check(
    await db().from("activities").insert({ type: "note", body: "Customer added by staff.", customer_id: customer.id, author_id: userId }),
  );
  return customer;
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  await requireStaff();
  const result = await db().from("customers").update(toColumns(input)).eq("id", id).select("*, contact_details(*)").maybeSingle();
  if (result.error) throw duplicateEmail(toApiError(result.error));
  if (!result.data) throw new ApiError("Customer not found", 404, "not_found");
  return toCustomer(result.data as CustomerRow);
}

/**
 * Deletes a customer and their activity log. Customers with bookings are kept (the database refuses
 * with "has_bookings"). Leads converted into this customer simply lose the link.
 */
export async function deleteCustomer(id: string): Promise<void> {
  await requireStaff();
  check(await db().from("customers").delete().eq("id", id));
}
