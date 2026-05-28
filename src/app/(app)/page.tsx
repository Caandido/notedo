import { Clock, Flame, Focus, Timer as TimerIcon } from "lucide-react";

import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { SubjectsCard } from "@/components/dashboard/subjects-card";
import { SessionsCard } from "@/components/dashboard/sessions-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Heatmap } from "@/components/dashboard/heatmap";
import { formatDuration } from "@/lib/utils";
import {
  dailyHoursLast7Days,
  generateHeatmap,
  mockGoals,
  mockSessions,
  mockSubjects,
  todayStats,
  weekStats,
} from "@/lib/mock-data";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const weeklyData = dailyHoursLast7Days();
  const heatmapData = generateHeatmap();

  return (
    <>
      <Header
        title={`${greeting()}, vamos estudar.`}
        subtitle={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      <div className="space-y-6 p-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Hoje"
            value={formatDuration(todayStats.studiedSeconds)}
            icon={Clock}
            trend={12}
            hint="vs ontem"
            accent="#a78bfa"
          />
          <StatCard
            label="Esta semana"
            value={formatDuration(weekStats.studiedSeconds)}
            icon={TimerIcon}
            trend={-4}
            hint="vs semana passada"
            accent="#60a5fa"
          />
          <StatCard
            label="Streak"
            value={`${todayStats.streak} dias`}
            icon={Flame}
            hint="recorde: 21"
            accent="#fb923c"
          />
          <StatCard
            label="Foco médio"
            value={`${todayStats.focusPercentage}%`}
            icon={Focus}
            trend={3}
            hint="últimos 7 dias"
            accent="#34d399"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyChart data={weeklyData} />
          </div>
          <GoalsCard goals={mockGoals} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Heatmap data={heatmapData} />
          </div>
          <SubjectsCard subjects={mockSubjects} />
        </section>

        <section>
          <SessionsCard sessions={mockSessions} />
        </section>
      </div>
    </>
  );
}
