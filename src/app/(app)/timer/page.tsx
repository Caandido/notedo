"use client";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { TimerPageContent } from "@/components/timer/timer-page";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getSubjectsForUser } from "@/lib/queries";

export default function TimerPage() {
  const { data: subjects, loading } = useRepoQuery(
    () => getSubjectsForUser(),
    []
  );

  return (
    <>
      <Header
        title="Cronômetro"
        subtitle="Pomodoro, livre, reverso e custom"
      />
      {loading || !subjects ? (
        <PageLoading />
      ) : (
        <TimerPageContent
          subjects={subjects.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
          }))}
        />
      )}
    </>
  );
}
