"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarSubscribe } from "@/components/calendar/calendar-subscribe";
import { formatHours } from "@/lib/utils";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getCalendarMonth, getSubjectsForUser } from "@/lib/queries";

function parseInt0(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export default function CalendarPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <CalendarPageContent />
    </React.Suspense>
  );
}

function CalendarPageContent() {
  const params = useSearchParams();
  const now = new Date();
  const year = parseInt0(params.get("y"), now.getFullYear());
  const monthRaw = parseInt0(params.get("m"), now.getMonth());
  const month = Math.max(0, Math.min(11, monthRaw));

  const calendarQ = useRepoQuery(() => getCalendarMonth(year, month), [year, month]);
  const subjectsQ = useRepoQuery(() => getSubjectsForUser(), []);

  if (calendarQ.loading || !calendarQ.data || subjectsQ.loading || !subjectsQ.data) {
    return <PageLoading />;
  }
  const data = calendarQ.data;
  const subjects = subjectsQ.data;

  return (
    <>
      <Header
        title="Calendário"
        subtitle={`${formatHours(data.totalSeconds)} em ${data.activeDays} dia${data.activeDays === 1 ? "" : "s"} ativo${data.activeDays === 1 ? "" : "s"} · ${data.sessionCount} sessões · ${data.reviewCount} revisões · ${data.eventCount} eventos`}
      />
      <div className="space-y-4 p-6">
        <div className="flex justify-end">
          <CalendarSubscribe />
        </div>
        <CalendarView
          year={year}
          month={month}
          days={data.days}
          subjects={subjects.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
          }))}
        />
      </div>
    </>
  );
}
