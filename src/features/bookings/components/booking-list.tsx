"use client";

import Link from "next/link";
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { content } from "@/content";
import { SearchBox } from "@/features/shared/search-box";
import type { BookingListParams } from "@/lib/booking-search";
import { BOOKING_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { useBookingList } from "../hooks/use-bookings";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";

const t = content.admin.bookings;

export function BookingList() {
  const list = useBookingList();
  const { params, result } = list;
  const sortState = (key: BookingListParams["sort"]) => (params.sort === key ? params.dir : "none");
  const filtered = params.q !== "" || params.status !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="text-lg text-muted">{t.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SearchBox value={params.q} onSearch={list.search} label={t.searchLabel} placeholder={t.searchPlaceholder} />
        <FormField label={t.filters.status} hideLabel>
          <Select
            value={params.status ?? ""}
            onChange={(e) => list.setStatus((e.target.value || undefined) as BookingListParams["status"])}
          >
            <option value="">
              {t.filters.status}: {content.admin.common.any}
            </option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {content.enums.bookingStatus[status]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {list.isError && !result ? (
        <ErrorState onRetry={() => list.refetch()} />
      ) : !result ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : result.total === 0 ? (
        filtered ? (
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
                  <TableHead>{t.columns.reference}</TableHead>
                  <TableHead>{t.columns.customer}</TableHead>
                  <TableHead>{t.columns.vehicle}</TableHead>
                  <TableHead sortDirection={sortState("pickup")} onSort={() => list.sortBy("pickup")}>
                    {t.columns.pickup}
                  </TableHead>
                  <TableHead>{t.columns.return}</TableHead>
                  <TableHead sortDirection={sortState("total")} onSort={() => list.sortBy("total")}>
                    {t.columns.total}
                  </TableHead>
                  <TableHead sortDirection={sortState("status")} onSort={() => list.sortBy("status")}>
                    {t.columns.status}
                  </TableHead>
                  <TableHead>{t.columns.payment}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/admin/bookings/${booking.id}`}>{booking.reference}</Link>
                    </TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.vehicleName}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(`${booking.pickupDate}T00:00:00+08:00`)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(`${booking.returnDate}T00:00:00+08:00`)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatCurrency(booking.total)}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>{booking.paymentStatus && <PaymentStatusBadge status={booking.paymentStatus} />}</TableCell>
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
    </div>
  );
}
