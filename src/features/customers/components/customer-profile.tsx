"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/api/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from "@/components/ui";
import { content } from "@/content";
import { ActivityLog } from "@/features/activities/components/activity-log";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { BOOKING_STATUS_BADGE } from "@/features/bookings/status-style";
import { ContactDetailsCard } from "@/features/contacts/components/contact-details-card";
import { formatCurrency } from "@/lib/currency";
import { formatDate, formatDateLong } from "@/lib/dates";
import { useCustomerMutations } from "../hooks/use-customer-mutations";
import { useCustomerProfile } from "../hooks/use-customers";
import { CustomerFormModal } from "./customer-form-modal";

const t = content.admin.customers;

export function CustomerProfile({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { can } = useAuth();
  const profile = useCustomerProfile(id);
  const { remove } = useCustomerMutations();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (profile.isError) return <ErrorState headingAs="h1" onRetry={() => profile.refetch()} />;
  if (profile.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (!profile.data) {
    return (
      <EmptyState
        headingAs="h1"
        title={content.admin.common.notFoundTitle}
        description={content.admin.common.notFoundDescription}
        action={
          <Button asChild>
            <Link href="/admin/customers">{t.profile.back}</Link>
          </Button>
        }
      />
    );
  }

  const { customer, bookings } = profile.data;
  const canEdit = can("customers.edit");
  const hasBookings = bookings.length > 0;

  function confirmDelete() {
    remove.mutate(id, {
      onSuccess: () => router.replace("/admin/customers"),
      onError: (error) => {
        setConfirmingDelete(false);
        if (error instanceof ApiError && error.code === "has_bookings") {
          toast({ title: t.deleteBlocked, variant: "danger" });
        } else {
          toast({ title: content.admin.common.saveError, variant: "danger" });
        }
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="link" className="self-start">
        <Link href="/admin/customers">← {t.profile.back}</Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1>{customer.name}</h1>
          <p className="text-muted">
            {t.profile.customerSince} {formatDate(customer.createdAt)}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              {content.admin.common.edit}
            </Button>
            <Button variant="outline" onClick={() => setConfirmingDelete(true)} disabled={hasBookings}>
              {content.admin.common.delete}
            </Button>
          </div>
        )}
      </div>
      {canEdit && hasBookings && <p className="text-sm text-muted">{t.deleteBlocked}</p>}

      <Tabs defaultValue="details">
        <TabsList aria-label={customer.name}>
          <TabsTrigger value="details">{t.profile.tabs.details}</TabsTrigger>
          {can("bookings.view") && <TabsTrigger value="bookings">{t.profile.tabs.bookings}</TabsTrigger>}
          <TabsTrigger value="activity">{t.profile.tabs.activity}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex flex-col gap-6">
          <Card as="section" aria-labelledby="details-heading">
            <CardHeader>
              <CardTitle as="h2" id="details-heading" className="text-xl">
                {t.profile.details}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">{t.form.phone}</dt>
                  <dd className="font-medium">
                    <a href={`tel:${customer.phone.replace(/[\s()-]/g, "")}`}>{customer.phone}</a>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-muted">{t.form.email}</dt>
                  <dd className="font-medium wrap-anywhere">
                    <a href={`mailto:${customer.email}`}>{customer.email}</a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.profile.license}</dt>
                  <dd className="font-medium">{customer.licenseNumber ?? content.admin.common.none}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted">{t.profile.notes}</dt>
                  <dd className="whitespace-pre-wrap">{customer.notes || t.profile.noNotes}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <ContactDetailsCard
            owner="customer"
            ownerId={customer.id}
            contacts={customer.additionalContacts}
            canEdit={canEdit}
          />
        </TabsContent>

        {can("bookings.view") && (
          <TabsContent value="bookings">
            <h2 className="mb-4">{t.profile.bookings}</h2>
            {bookings.length === 0 ? (
              <p className="text-muted">{t.profile.noBookings}</p>
            ) : (
              <Table label={t.profile.bookings}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.profile.bookingColumns.reference}</TableHead>
                    <TableHead>{t.profile.bookingColumns.vehicle}</TableHead>
                    <TableHead>{t.profile.bookingColumns.dates}</TableHead>
                    <TableHead>{t.profile.bookingColumns.total}</TableHead>
                    <TableHead>{t.profile.bookingColumns.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(({ booking, vehicleName }) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono">{booking.reference}</TableCell>
                      <TableCell>{vehicleName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateLong(booking.pickupDate)} to {formatDateLong(booking.returnDate)}
                      </TableCell>
                      <TableCell>{formatCurrency(booking.total)}</TableCell>
                      <TableCell>
                        <Badge variant={BOOKING_STATUS_BADGE[booking.status]}>
                          {content.enums.bookingStatus[booking.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        )}

        <TabsContent value="activity">
          <ActivityLog entityType="customer" entityId={customer.id} />
        </TabsContent>
      </Tabs>

      <CustomerFormModal open={editing} onOpenChange={setEditing} customer={customer} />
      <ConfirmModal
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t.deleteTitle}
        description={t.deleteDescription}
        confirmLabel={content.admin.common.confirmDelete}
        cancelLabel={content.admin.common.cancel}
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
