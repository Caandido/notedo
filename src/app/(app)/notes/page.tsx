import { GraduationCap } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/grade-form";
import { GradeRow } from "@/components/grades/grade-row";
import { SubjectAverageCard } from "@/components/grades/subject-average-card";
import { gradeColorByPercent } from "@/components/grades/grade-styles";
import { cn } from "@/lib/utils";
import {
  getGradesForUser,
  getGradesSummary,
  getSubjectsForUser,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [grades, summary, subjects] = await Promise.all([
    getGradesForUser(),
    getGradesSummary(),
    getSubjectsForUser(),
  ]);

  const subjectOptions = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  const overallPercent =
    summary.overallAverage !== null ? (summary.overallAverage / 10) * 100 : 0;

  return (
    <>
      <Header
        title="Notas"
        subtitle={
          summary.totalGrades === 0
            ? "Registre suas notas acadêmicas pra acompanhar médias"
            : `${summary.totalGrades} nota${summary.totalGrades === 1 ? "" : "s"} · média ${summary.overallAverage?.toFixed(1) ?? "—"} / 10`
        }
      />
      <div className="space-y-6 p-6">
        <GradeForm subjects={subjectOptions} />

        {grades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <GraduationCap className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma nota ainda</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                Registre provas, trabalhos, quizzes — cada nota tem peso e máxima
                configuráveis. A média ponderada aparece por matéria e no geral.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {summary.overallAverage !== null && (
              <Card>
                <CardContent className="flex items-center gap-6 p-6">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "font-mono text-4xl font-semibold tabular-nums",
                        gradeColorByPercent(overallPercent)
                      )}
                    >
                      {summary.overallAverage.toFixed(1)}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      / 10
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Média geral</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Ponderada por peso, normalizada para escala 0–10
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {summary.bySubject.filter((s) => s.count > 0).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Médias por matéria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.bySubject
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <SubjectAverageCard key={s.id} subject={s} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Todas as notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {grades.map((g) => (
                  <GradeRow key={g.id} grade={g} subjects={subjectOptions} />
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
