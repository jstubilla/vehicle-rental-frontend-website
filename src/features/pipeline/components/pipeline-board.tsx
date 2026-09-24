"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Alert, ErrorState, FormField, GripIcon, Select, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { LeadStageBadge } from "@/features/leads/stage-style";
import { useUsers } from "@/features/users/hooks/use-users";
import { cn } from "@/lib/cn";
import { LEAD_STAGES, type LeadStage } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/dates";
import { UNASSIGNED, type LeadRow } from "@/lib/lead-search";
import { usePipeline } from "../hooks/use-pipeline";

const t = content.admin.pipeline;

/** What a lead card shows. Used for the real card and for the copy that follows the pointer while dragging. */
function LeadCardBody({ lead }: { lead: LeadRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Link href={`/admin/leads/${lead.id}`} className="font-medium wrap-anywhere">
        {lead.name}
      </Link>
      <span className="text-sm text-muted">{lead.phone}</span>
      {lead.vehicleName && <span className="text-sm">{lead.vehicleName}</span>}
      <span className="text-sm text-muted">
        {lead.assigneeName ?? content.admin.common.unassigned} · {formatRelativeTime(lead.createdAt)}
      </span>
    </div>
  );
}

function LeadCard({ lead, canMove, onMove }: { lead: LeadRow; canMove: boolean; onMove: (stage: LeadStage) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id, disabled: !canMove });

  return (
    <li
      ref={setNodeRef}
      data-surface="card"
      className={cn("flex flex-col gap-3 rounded-lg border border-border bg-card p-3 text-foreground", isDragging && "opacity-40")}
    >
      <div className="flex items-start gap-2">
        {canMove && (
          <button
            type="button"
            aria-label={t.dragHandle(lead.name)}
            className="mt-0.5 inline-flex size-control-sm shrink-0 cursor-grab items-center justify-center rounded-md text-muted hover:bg-surface-muted"
            {...attributes}
            {...listeners}
          >
            <GripIcon />
          </button>
        )}
        <LeadCardBody lead={lead} />
      </div>
      {canMove && (
        <FormField label={`${t.moveTo}: ${lead.name}`} hideLabel>
          <Select value={lead.stage} onChange={(e) => onMove(e.target.value as LeadStage)}>
            {LEAD_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {t.moveTo}: {content.enums.leadStage[stage]}
              </option>
            ))}
          </Select>
        </FormField>
      )}
    </li>
  );
}

function StageColumn({
  stage,
  leads,
  canMove,
  onMove,
}: {
  stage: LeadStage;
  leads: LeadRow[];
  canMove: boolean;
  onMove: (lead: LeadRow, stage: LeadStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`stage-${stage}`}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border bg-surface-muted p-3",
        isOver ? "border-2 border-primary" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`stage-${stage}`} className="text-base">
          <LeadStageBadge stage={stage} />
        </h2>
        <span className="text-sm text-muted">{t.columnCount(leads.length)}</span>
      </div>
      {leads.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-strong p-4 text-center text-sm text-muted">
          {t.emptyColumn}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} canMove={canMove} onMove={(next) => onMove(lead, next)} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function PipelineBoard() {
  const { can } = useAuth();
  const { leads, isError, refetch, move } = usePipeline();
  const users = useUsers();
  const [assignee, setAssignee] = useState("");
  const [dragging, setDragging] = useState<LeadRow | null>(null);
  const canMove = can("leads.edit");

  // The pointer needs to travel a little before a drag starts, so clicks on cards still work.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  const visible = (leads ?? []).filter((lead) => {
    if (!assignee) return true;
    return assignee === UNASSIGNED ? lead.assigneeId === null : lead.assigneeId === assignee;
  });

  function moveLead(lead: LeadRow, stage: LeadStage) {
    if (lead.stage !== stage) move.mutate({ id: lead.id, stage, name: lead.name });
  }

  function onDragStart(event: DragStartEvent) {
    setDragging(visible.find((lead) => lead.id === event.active.id) ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    const lead = visible.find((row) => row.id === event.active.id);
    const stage = event.over?.id as LeadStage | undefined;
    if (lead && stage && LEAD_STAGES.includes(stage)) moveLead(lead, stage);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="max-w-narrow text-lg text-muted">{t.description}</p>
      </div>

      {!canMove && <Alert variant="info">{t.readOnly}</Alert>}

      <FormField label={t.assigneeFilter} className="sm:max-w-xs">
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">{content.admin.common.any}</option>
          <option value={UNASSIGNED}>{content.admin.common.unassigned}</option>
          {users.data?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      </FormField>

      {isError && !leads ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !leads ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5" aria-hidden="true">
          {LEAD_STAGES.map((stage) => (
            <Skeleton key={stage} className="h-64" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <div role="group" aria-label={t.boardLabel} className="grid items-start gap-4 md:grid-cols-3 xl:grid-cols-5">
            {LEAD_STAGES.map((stage) => (
              <StageColumn
                key={stage}
                stage={stage}
                leads={visible.filter((lead) => lead.stage === stage)}
                canMove={canMove}
                onMove={moveLead}
              />
            ))}
          </div>
          <DragOverlay>
            {dragging ? (
              <div data-surface="card" className="rounded-lg border border-border-strong bg-card p-3 text-foreground">
                <LeadCardBody lead={dragging} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
