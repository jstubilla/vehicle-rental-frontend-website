"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { content } from "@/content";
import { Can } from "@/features/auth/components/permission-gate";
import { SearchBox } from "@/features/shared/search-box";
import { formatDate } from "@/lib/dates";
import { useCustomerList } from "../hooks/use-customers";
import { CustomerFormModal } from "./customer-form-modal";

const t = content.admin.customers;

export function CustomerList() {
  const router = useRouter();
  const list = useCustomerList();
  const [adding, setAdding] = useState(false);
  const { params, result } = list;

  const sortState = (key: typeof params.sort) => (params.sort === key ? params.dir : "none");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{t.title}</h1>
          <p className="text-lg text-muted">{t.description}</p>
        </div>
        <Can permission="customers.edit">
          <Button onClick={() => setAdding(true)}>{t.add}</Button>
        </Can>
      </div>

      <SearchBox
        value={params.q}
        onSearch={list.search}
        label={t.searchLabel}
        placeholder={t.searchPlaceholder}
        className="max-w-form"
      />

      {list.isError && !result ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : !result ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : result.total === 0 ? (
        params.q ? (
          <EmptyState
            title={content.admin.common.noResultsTitle}
            description={content.admin.common.noResultsDescription}
            action={
              <Button variant="outline" onClick={list.clear}>
                {content.admin.common.clearFilters}
              </Button>
            }
          />
        ) : (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        )
      ) : (
        <>
          <div aria-busy={list.isFetching} className={list.isFetching ? "opacity-60" : undefined}>
            <Table label={t.title} variant="striped">
              <TableHeader>
                <TableRow>
                  <TableHead sortDirection={sortState("name")} onSort={() => list.sortBy("name")}>
                    {t.columns.name}
                  </TableHead>
                  <TableHead>{t.columns.phone}</TableHead>
                  <TableHead>{t.columns.email}</TableHead>
                  <TableHead sortDirection={sortState("bookings")} onSort={() => list.sortBy("bookings")}>
                    {t.columns.bookings}
                  </TableHead>
                  <TableHead sortDirection={sortState("created")} onSort={() => list.sortBy("created")}>
                    {t.columns.added}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/customers/${customer.id}`}>{customer.name}</Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{customer.phone}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.bookingCount}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(customer.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p role="status" className="text-sm text-muted">
              {content.admin.common.showingRange(
                (result.page - 1) * result.pageSize + 1,
                Math.min(result.page * result.pageSize, result.total),
                result.total,
              )}
            </p>
            <Pagination page={result.page} pageCount={result.pageCount} onPageChange={list.setPage} />
          </div>
        </>
      )}

      <CustomerFormModal
        open={adding}
        onOpenChange={setAdding}
        onSaved={(id) => router.push(`/admin/customers/${id}`)}
      />
    </div>
  );
}
