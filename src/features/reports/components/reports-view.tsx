"use client";

import { useState } from "react";
import {
  BarChart,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DatePicker,
  ErrorState,
  FormField,
  Skeleton,
  StatCard,
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
} from "@/components/ui";
import { content } from "@/content";
import { LEAD_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { formatMonth } from "@/lib/dates";
import { RANGE_PRESETS, type ReportData } from "@/lib/reports";
import { useReport } from "../hooks/use-report";

const t = content.admin.reports;

/** A chart with the same numbers available as a table, so nothing depends on seeing the chart. */
function ReportCard({
  id,
  title,
  description,
  chart,
  table,
}: {
  id: string;
  title: string;
  description: string;
  chart: React.ReactNode;
  table: React.ReactNode;
}) {
  return (
    <Card as="section" aria-labelledby={id}>
      <CardHeader>
        <CardTitle as="h2" id={id} className="text-xl">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList aria-label={title}>
            <TabsTrigger value="chart">{t.tabs.chart}</TabsTrigger>
            <TabsTrigger value="table">{t.tabs.table}</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">{chart}</TabsContent>
          <TabsContent value="table">{table}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function Reports({ report }: { report: ReportData }) {
  const months = report.leadsByMonth.map((entry) => formatMonth(entry.month));

  return (
    <>
      <section aria-label={t.summary.label}>
        <h2 className="sr-only">{t.summary.label}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.summary.leads} value={report.totalLeads} hint={t.summary.leadsHint} />
          <StatCard label={t.summary.customers} value={report.totalCustomers} hint={t.summary.customersHint} />
          <StatCard label={t.summary.bookings} value={report.totalBookings} hint={t.summary.bookingsHint} />
          <StatCard label={t.summary.revenue} value={formatCurrency(report.totalRevenue)} hint={t.summary.revenueHint} />
        </div>
      </section>

      <ReportCard
        id="report-stage"
        title={t.leadsByStage.title}
        description={t.leadsByStage.description}
        chart={
          <BarChart
            label={t.leadsByStage.chartLabel}
            scrollLabel={t.scroll(t.leadsByStage.chartLabel)}
            categories={LEAD_STAGES.map((stage) => content.enums.leadStage[stage])}
            series={[{ name: t.leadsByStage.count, values: LEAD_STAGES.map((stage) => report.leadsByStage[stage]) }]}
          />
        }
        table={
          <Table label={`${t.leadsByStage.title} (${t.tabs.table})`}>
            <TableHeader>
              <TableRow>
                <TableHead>{t.leadsByStage.stage}</TableHead>
                <TableHead>{t.leadsByStage.count}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEAD_STAGES.map((stage) => (
                <TableRow key={stage}>
                  <TableCell>{content.enums.leadStage[stage]}</TableCell>
                  <TableCell>{report.leadsByStage[stage]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <ReportCard
        id="report-over-time"
        title={t.overTime.title}
        description={t.overTime.description}
        chart={
          <BarChart
            label={t.overTime.chartLabel}
            scrollLabel={t.scroll(t.overTime.chartLabel)}
            categories={months}
            series={[
              { name: t.overTime.leads, values: report.leadsByMonth.map((e) => e.count) },
              { name: t.overTime.customers, values: report.customersByMonth.map((e) => e.count) },
            ]}
          />
        }
        table={
          <Table label={`${t.overTime.title} (${t.tabs.table})`}>
            <TableHeader>
              <TableRow>
                <TableHead>{t.month}</TableHead>
                <TableHead>{t.overTime.leads}</TableHead>
                <TableHead>{t.overTime.customers}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.leadsByMonth.map((entry, index) => (
                <TableRow key={entry.month}>
                  <TableCell>{formatMonth(entry.month)}</TableCell>
                  <TableCell>{entry.count}</TableCell>
                  <TableCell>{report.customersByMonth[index]?.count ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <ReportCard
        id="report-revenue"
        title={t.revenue.title}
        description={t.revenue.description}
        chart={
          <BarChart
            label={t.revenue.chartLabel}
            scrollLabel={t.scroll(t.revenue.chartLabel)}
            categories={months}
            series={[{ name: t.revenue.revenue, values: report.bookingsByMonth.map((e) => e.revenue) }]}
            formatValue={formatCurrency}
          />
        }
        table={
          <Table label={`${t.revenue.title} (${t.tabs.table})`}>
            <TableHeader>
              <TableRow>
                <TableHead>{t.month}</TableHead>
                <TableHead>{t.revenue.bookings}</TableHead>
                <TableHead>{t.revenue.revenue}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.bookingsByMonth.map((entry) => (
                <TableRow key={entry.month}>
                  <TableCell>{formatMonth(entry.month)}</TableCell>
                  <TableCell>{entry.bookings}</TableCell>
                  <TableCell>{formatCurrency(entry.revenue)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold">{t.revenue.total}</TableCell>
                <TableCell className="font-semibold">{report.totalBookings}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(report.totalRevenue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        }
      />
    </>
  );
}

export function ReportsView() {
  const { range, valid, report, isFetching, isError, refetch, setRange } = useReport();
  // Bumped when a quick range is chosen, so the date pickers restart from the new dates.
  const [pickerKey, setPickerKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="text-lg text-muted">{t.description}</p>
      </div>

      <Card as="section" aria-labelledby="range-heading">
        <CardHeader>
          <CardTitle as="h2" id="range-heading" className="text-xl">
            {t.range.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div key={pickerKey} className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <FormField label={t.range.from}>
              <DatePicker value={range.from} onChange={(from) => setRange({ from })} />
            </FormField>
            <FormField label={t.range.to} error={valid ? undefined : t.range.invalid}>
              <DatePicker value={range.to} onChange={(to) => setRange({ to })} />
            </FormField>
          </div>
          <div role="group" aria-label={t.range.presetsLabel} className="flex flex-wrap gap-2">
            {(Object.keys(RANGE_PRESETS) as (keyof typeof RANGE_PRESETS)[]).map((key) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => {
                  setRange(RANGE_PRESETS[key]());
                  setPickerKey((n) => n + 1);
                }}
              >
                {t.range.presets[key]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!valid ? null : isError && !report ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !report ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div aria-busy={isFetching} className={isFetching ? "flex flex-col gap-6 opacity-60" : "flex flex-col gap-6"}>
          <Reports report={report} />
        </div>
      )}
    </div>
  );
}
