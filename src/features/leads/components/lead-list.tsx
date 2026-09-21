"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Can } from "@/features/auth/components/permission-gate";
import { SearchBox } from "@/features/shared/search-box";
import { useUsers } from "@/features/users/hooks/use-users";
import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { UNASSIGNED, type LeadListParams } from "@/lib/lead-search";
import { useLeadList } from "../hooks/use-leads";
import { LeadStageBadge } from "../stage-style";
import { LeadFormModal } from "./lead-form-modal";

const t = content.admin.leads;

export function LeadList() {
  const router = useRouter();
  const list = useLeadList();
  const users = useUsers();
  const [adding, setAdding] = useState(false);
  const { params, result } = list;

  const sortState = (key: LeadListParams["sort"]) => (params.sort === key ? params.dir : "none");
  const filtered = list.activeFilterCount > 0 || params.q !== "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1>{t.title}</h1>
          <p className="text-lg text-muted">{t.description}</p>
        </div>
        <Can permission="leads.edit">
          <Button onClick={() => setAdding(true)}>{t.add}</Button>
        </Can>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SearchBox
          value={params.q}
          onSearch={list.search}
          label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          className="md:col-span-2 lg:col-span-1"
        />
        <FormField label={t.filters.stage} hideLabel>
          <Select
            value={params.stage ?? ""}
            onChange={(e) => list.setFilter({ stage: (e.target.value || undefined) as LeadListParams["stage"] })}
          >
            <option value="">{t.filters.stage}: {content.admin.common.any}</option>
            {LEAD_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {content.enums.leadStage[stage]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.filters.source} hideLabel>
          <Select
            value={params.source ?? ""}
            onChange={(e) => list.setFilter({ source: (e.target.value || undefined) as LeadListParams["source"] })}
          >
            <option value="">{t.filters.source}: {content.admin.common.any}</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {content.enums.leadSource[source]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t.filters.assignee} hideLabel>
          <Select
            value={params.assignee ?? ""}
            onChange={(e) => list.setFilter({ assignee: e.target.value || undefined })}
          >
            <option value="">{t.filters.assignee}: {content.admin.common.any}</option>
            <option value={UNASSIGNED}>{content.admin.common.unassigned}</option>
            {users.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
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
                  <TableHead sortDirection={sortState("name")} onSort={() => list.sortBy("name")}>
                    {t.columns.name}
                  </TableHead>
                  <TableHead>{t.columns.contact}</TableHead>
                  <TableHead>{t.columns.source}</TableHead>
                  <TableHead sortDirection={sortState("stage")} onSort={() => list.sortBy("stage")}>
                    {t.columns.stage}
                  </TableHead>
                  <TableHead>{t.columns.vehicle}</TableHead>
                  <TableHead>{t.columns.assignee}</TableHead>
                  <TableHead sortDirection={sortState("created")} onSort={() => list.sortBy("created")}>
                    {t.columns.created}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                    </TableCell>
                    <TableCell>
                      <span className="block whitespace-nowrap">{lead.phone}</span>
                      <span className="block text-muted">{lead.email}</span>
                    </TableCell>
                    <TableCell>{content.enums.leadSource[lead.source]}</TableCell>
                    <TableCell>
                      <LeadStageBadge stage={lead.stage} />
                    </TableCell>
                    <TableCell>{lead.vehicleName ?? content.admin.common.none}</TableCell>
                    <TableCell>{lead.assigneeName ?? content.admin.common.unassigned}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(lead.createdAt)}</TableCell>
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

      <LeadFormModal open={adding} onOpenChange={setAdding} onSaved={(id) => router.push(`/admin/leads/${id}`)} />
    </div>
  );
}
