"use client";

import { useState } from "react";
import type { StaffRow } from "@/api/users";
import {
  Badge,
  Button,
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
} from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useStaff, useUserMutations } from "../hooks/use-staff";
import { UserFormModal } from "./user-form-modal";

const t = content.admin.users;

export function UserTable() {
  const { session } = useAuth();
  const staff = useStaff();
  const { setActive } = useUserMutations();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [deactivating, setDeactivating] = useState<StaffRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{t.title}</h1>
          <p className="max-w-narrow text-lg text-muted">{t.description}</p>
        </div>
        <Button onClick={() => setAdding(true)}>{t.add}</Button>
      </div>

      {staff.isError ? (
        <ErrorState onRetry={() => staff.refetch()} />
      ) : staff.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : staff.data.length === 0 ? (
        <EmptyState title={t.emptyTitle} />
      ) : (
        <Table label={t.title} variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.name}</TableHead>
              <TableHead>{t.columns.email}</TableHead>
              <TableHead>{t.columns.role}</TableHead>
              <TableHead>{t.columns.status}</TableHead>
              <TableHead>{t.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.data.map((user) => {
              const isYou = user.id === session?.userId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name} {isYou && <span className="font-normal text-muted">{t.you}</span>}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roleName}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "success" : "neutral"}>
                      {user.active ? t.statuses.active : t.statuses.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                        {content.admin.common.edit}
                        <span className="sr-only"> {user.name}</span>
                      </Button>
                      {user.active ? (
                        <Button variant="ghost" size="sm" disabled={isYou} onClick={() => setDeactivating(user)}>
                          {t.deactivate}
                          <span className="sr-only"> {user.name}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={setActive.isPending && setActive.variables?.id === user.id}
                          onClick={() => setActive.mutate({ id: user.id, active: true })}
                        >
                          {t.reactivate}
                          <span className="sr-only"> {user.name}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <UserFormModal open={adding} onOpenChange={setAdding} />
      <UserFormModal open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} user={editing ?? undefined} />
      <ConfirmModal
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={deactivating ? t.deactivateTitle(deactivating.name) : ""}
        description={t.deactivateDescription}
        confirmLabel={t.deactivate}
        cancelLabel={content.admin.common.cancel}
        loading={setActive.isPending}
        onConfirm={() =>
          deactivating && setActive.mutate({ id: deactivating.id, active: false }, { onSettled: () => setDeactivating(null) })
        }
      />
    </div>
  );
}
