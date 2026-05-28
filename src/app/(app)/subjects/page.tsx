"use client";

import { BookOpen } from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectRow } from "@/components/subjects/subject-row";
import { NewSubjectForm } from "@/components/subjects/new-subject-form";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getSubjectsForUser } from "@/lib/queries";

export default function SubjectsPage() {
  const { data: subjects, loading } = useRepoQuery(
    () => getSubjectsForUser(),
    []
  );
  if (loading || !subjects) return <PageLoading />;

  const totalSeconds = subjects.reduce((acc, s) => acc + s.totalSeconds, 0);

  return (
    <>
      <Header
        title="Matérias"
        subtitle={`${subjects.length} ativa${subjects.length === 1 ? "" : "s"} · ${(totalSeconds / 3600).toFixed(1)}h totais`}
      />
      <div className="space-y-4 p-6">
        <NewSubjectForm />

        {subjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <BookOpen className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma matéria ainda</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                Crie sua primeira matéria para começar a organizar seus estudos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <SubjectRow key={s.id} subject={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
