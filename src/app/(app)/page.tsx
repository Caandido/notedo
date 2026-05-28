"use client";

import Link from "next/link";
import { Clock, Flame, Repeat, Timer as TimerIcon } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { StatCard } from "@/components/dashboard/stat-card";
import { GoalsCard } from "@/components/dashboard/goals-card";
import { SubjectsCard } from "@/components/dashboard/subjects-card";
import { SessionsCard } from "@/components/dashboard/sessions-card";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Heatmap } from "@/components/dashboard/heatmap";
import { formatDuration } from "@/lib/utils";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getDashboardData } from "@/lib/queries";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const { data, loading } = useRepoQuery(() => getDashboardData(), []);
  if (loading || !data) return <PageLoading />;

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
            value={formatDuration(data.today.studiedSeconds)}
            icon={Clock}
            hint={`${data.today.sessions} sessões`}
            accent="#a78bfa"
          />
          <StatCard
            label="Esta semana"
            value={formatDuration(data.week.studiedSeconds)}
            icon={TimerIcon}
            hint="últimos 7 dias"
            accent="#60a5fa"
          />
          <StatCard
            label="Streak"
            value={`${data.today.streak} ${data.today.streak === 1 ? "dia" : "dias"}`}
            icon={Flame}
            hint="dias consecutivos"
            accent="#fb923c"
          />
          <Link href="/reviews" className="group">
            <StatCard
              label="Revisões hoje"
              value={`${data.reviews.today + data.reviews.flashcardsDue}`}
              icon={Repeat}
              hint={
                data.reviews.today + data.reviews.flashcardsDue === 0
                  ? "tudo em dia"
                  : `${data.reviews.today} revisões · ${data.reviews.flashcardsDue} flashcards`
              }
              accent="#34d399"
            />
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeeklyChart data={data.weekly} />
          </div>
          <GoalsCard goals={data.goals} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Heatmap data={data.heatmap} />
          </div>
          <SubjectsCard subjects={data.subjects} />
        </section>

        <section>
          <SessionsCard sessions={data.sessions} />
        </section>
      </div>
    </>
  );
}
