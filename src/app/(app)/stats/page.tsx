"use client";

import * as React from "react";
import {
  Activity,
  CalendarCheck,
  Clock,
  Focus,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { StatCard } from "@/components/dashboard/stat-card";
import { PeriodTabs } from "@/components/stats/period-tabs";
import { SubjectChart } from "@/components/stats/subject-chart";
import { WeekdayChart } from "@/components/stats/weekday-chart";
import { ModeChart } from "@/components/stats/mode-chart";
import { WritingCard } from "@/components/stats/writing-card";
import { GradesOverview } from "@/components/stats/grades-overview";
import { formatDuration } from "@/lib/utils";
import { useRepoQuery } from "@/lib/db/use-repo";
import {
  getContentStatsForPeriod,
  getGradesSummary,
  getStatsForPeriod,
} from "@/lib/queries";

const ALLOWED_PERIODS = new Set(["7", "30", "90", "365"]);

export default function StatsPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <StatsPageContent />
    </React.Suspense>
  );
}

function StatsPageContent() {
  const params = useSearchParams();
  const periodParam = params.get("period") ?? "30";
  const period = ALLOWED_PERIODS.has(periodParam) ? periodParam : "30";
  const n = parseInt(period, 10);

  const statsQ = useRepoQuery(() => getStatsForPeriod(n), [n]);
  const contentQ = useRepoQuery(() => getContentStatsForPeriod(n), [n]);
  const gradesQ = useRepoQuery(() => getGradesSummary(), []);

  if (
    statsQ.loading || !statsQ.data ||
    contentQ.loading || !contentQ.data ||
    gradesQ.loading || !gradesQ.data
  ) {
    return <PageLoading />;
  }
  const stats = statsQ.data;
  const contentStats = contentQ.data;
  const gradesSummary = gradesQ.data;

  const bestDayLabel = stats.bestDay
    ? new Date(stats.bestDay.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "—";

  return (
    <>
      <Header
        title="Estatísticas"
        subtitle={`Últimos ${period} dias · ${stats.activeDays} dia${stats.activeDays === 1 ? "" : "s"} ativo${stats.activeDays === 1 ? "" : "s"}`}
      />
      <div className="space-y-6 p-6">
        <PeriodTabs current={period} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total estudado"
            value={formatDuration(stats.totalSeconds)}
            icon={Clock}
            hint={`${stats.sessionCount} sessões`}
            accent="#a78bfa"
          />
          <StatCard
            label="Média diária"
            value={`${stats.avgPerActiveDay.toFixed(1)}h`}
            icon={TrendingUp}
            hint="por dia ativo"
            accent="#60a5fa"
          />
          <StatCard
            label="Melhor dia"
            value={
              stats.bestDay ? `${stats.bestDay.hours.toFixed(1)}h` : "—"
            }
            icon={CalendarCheck}
            hint={stats.bestDay ? bestDayLabel : "—"}
            accent="#fb923c"
          />
          <StatCard
            label="Foco médio"
            value={stats.focusAvg > 0 ? `${stats.focusAvg}%` : "—"}
            icon={Focus}
            hint="todas as sessões"
            accent="#34d399"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SubjectChart data={stats.bySubject} />
          <WeekdayChart data={stats.byWeekday} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ModeChart data={stats.byMode} />
          </div>
          <StatCard
            label="Sessões"
            value={`${stats.sessionCount}`}
            icon={Activity}
            hint={`${
              stats.sessionCount > 0 && stats.activeDays > 0
                ? (stats.sessionCount / stats.activeDays).toFixed(1)
                : "0"
            } / dia ativo`}
            accent="#f472b6"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GradesOverview
            totalGrades={gradesSummary.totalGrades}
            overallAverage={gradesSummary.overallAverage}
            bySubject={gradesSummary.bySubject}
          />
          <WritingCard
            data={contentStats.writingByDay}
            totals={{
              totalTopics: contentStats.totalTopics,
              topicsWithContent: contentStats.topicsWithContent,
              topicsTouched: contentStats.topicsTouched,
            }}
          />
        </section>
      </div>
    </>
  );
}
