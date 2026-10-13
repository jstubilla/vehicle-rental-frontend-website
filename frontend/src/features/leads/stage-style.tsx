import { Badge, type BadgeVariant } from "@/components/ui";
import { content } from "@/content";
import type { LeadStage } from "@/lib/constants";

/**
 * How each lead stage looks as a badge. The stages themselves come from LEAD_STAGES
 * in lib/constants.ts and their words from content, so this is the only place that
 * decides stage styling for the list, the detail page, the dashboard and the reports.
 */
export const LEAD_STAGE_BADGE: Record<LeadStage, BadgeVariant> = {
  new: "outline",
  contacted: "info",
  qualified: "warning",
  won: "success",
  lost: "danger",
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge variant={LEAD_STAGE_BADGE[stage]}>{content.enums.leadStage[stage]}</Badge>;
}
