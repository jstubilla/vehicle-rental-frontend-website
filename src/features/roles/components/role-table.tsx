"use client";

import { useState } from "react";
import type { RoleRow } from "@/api/roles";
import {
  Alert,
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
import { PERMISSIONS } from "@/lib/constants";
import { useRoleMutations, useRoleRows } from "../hooks/use-roles";
import { RoleFormModal } from "./role-form-modal";

const t = content.admin.roles;

export function RoleTable() {
  const roles = useRoleRows();
  const { remove } = useRoleMutations();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{t.title}</h1>
          <p className="max-w-narrow text-lg text-muted">{t.description}</p>
        </div>
        <Button onClick={() => setAdding(true)}>{t.add}</Button>
      </div>

      <Alert variant="info">{t.applyNote}</Alert>

      {roles.isError ? (
        <ErrorState onRetry={() => roles.refetch()} />
      ) : roles.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : roles.data.length === 0 ? (
        <EmptyState title={t.title} />
      ) : (
        <>
          <Table label={t.title} variant="striped">
            <TableHeader>
              <TableRow>
                <TableHead>{t.columns.name}</TableHead>
                <TableHead>{t.columns.description}</TableHead>
                <TableHead>{t.columns.permissions}</TableHead>
                <TableHead>{t.columns.users}</TableHead>
                <TableHead>{t.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {role.name} {role.system && <Badge variant="outline">{t.builtIn}</Badge>}
                  </TableCell>
                  <TableCell className="min-w-56">{role.description}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.permissionCount(role.permissions.length, PERMISSIONS.length)}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(role)}>
                        {content.admin.common.edit}
                        <span className="sr-only"> {role.name}</span>
                      </Button>
                      {!role.system && (
                        <Button variant="ghost" size="sm" disabled={role.userCount > 0} onClick={() => setDeleting(role)}>
                          {content.admin.common.delete}
                          <span className="sr-only"> {role.name}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted">{t.deleteHint}</p>
        </>
      )}

      <RoleFormModal open={adding} onOpenChange={setAdding} />
      <RoleFormModal open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} role={editing ?? undefined} />
      <ConfirmModal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t.deleteTitle(deleting.name) : ""}
        description={t.deleteDescription}
        confirmLabel={content.admin.common.confirmDelete}
        cancelLabel={content.admin.common.cancel}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  );
}
