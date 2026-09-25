"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { content } from "@/content";
import { ActivityItem } from "@/features/activities/components/activity-item";
import { useRecentActivities } from "@/features/activities/hooks/use-activities";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { LeadStageBadge } from "@/features/leads/stage-style";
import { LEAD_STAGES } from "@/lib/constants";
import { useDashboardSummary } from "../hooks/use-dashboard";

const t = content.admin.dashboard;

export function DashboardView() {
  const { session } = useAuth();
  const summary = useDashboardSummary();
  const activities = useRecentActivities(8);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="text-lg text-muted">{t.welcome(session?.name ?? "")}</p>
      </div>

      <section aria-label={t.cardsLabel}>
        <h2 className="sr-only">{t.cardsLabel}</h2>
        {summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : summary.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <>
                <StatCard
                  label={t.cards.leads}
                  value={summary.data.leads.open}
                  hint={t.cardHints.leads}
                  href="/admin/leads"
                />
                <StatCard
                  label={t.cards.newLeads}
                  value={summary.data.leads.new}
                  hint={t.cardHints.newLeads}
                  href="/admin/leads?stage=new"
                />
            </>
            <StatCard
                label={t.cards.customers}
                value={summary.data.customers.total}
                hint={t.cardHints.customers}
                href="/admin/customers"
              />
              <StatCard
                label={t.cards.tasks}
                value={summary.data.tasks.open}
                hint={t.cardHints.tasks(summary.data.tasks.overdue)}
                href="/admin/tasks"
              />
              <>
                <StatCard
                  label={t.cards.activeBookings}
                  value={summary.data.bookings.active}
                  hint={t.cardHints.activeBookings}
                  href="/admin/bookings?status=active"
                />
                <StatCard
                  label={t.cards.pendingBookings}
                  value={summary.data.bookings.pending}
                  hint={t.cardHints.pendingBookings}
                  href="/admin/bookings?status=pending"
                />
              </>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card as="section" aria-labelledby="recent-activity-heading" className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2" id="recent-activity-heading" className="text-xl">
              {t.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.isError ? (
              <ErrorState onRetry={() => activities.refetch()} />
            ) : activities.isPending ? (
              <div className="flex flex-col gap-3" aria-hidden="true">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : activities.data.length === 0 ? (
              <EmptyState title={t.noActivityTitle} description={t.noActivityDescription} />
            ) : (
              <ul>
                {activities.data.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} showEntity />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {summary.data && (
          <Card as="section" aria-labelledby="leads-by-stage-heading" className="min-w-0 lg:col-span-1">
            <CardHeader>
              <CardTitle as="h2" id="leads-by-stage-heading" className="text-xl">
                {t.leadsByStage}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {LEAD_STAGES.map((stage) => (
                  <li
                    key={stage}
                    className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
                  >
                    <Link href={`/admin/leads?stage=${stage}`} className="no-underline">
                      <LeadStageBadge stage={stage} />
                    </Link>
                    <span className="font-semibold">{summary.data.leads.byStage[stage]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
