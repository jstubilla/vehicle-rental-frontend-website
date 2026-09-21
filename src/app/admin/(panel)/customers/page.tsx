import type { Metadata } from "next";
import { Suspense } from "react";
import { content } from "@/content";
import { CustomerList } from "@/features/customers/components/customer-list";

export const metadata: Metadata = { title: content.admin.customers.title };

export default function CustomersPage() {
  // The list keeps its search, sort and page in the URL, which needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CustomerList />
    </Suspense>
  );
}
