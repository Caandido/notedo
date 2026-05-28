import { GraduationCap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { gradeColorByPercent } from "@/components/grades/grade-styles";
import { cn } from "@/lib/utils";

interface GradesOverviewProps {
  totalGrades: number;
  overallAverage: number | null;
  bySubject: {
    id: string;
    name: string;
    color: string;
    count: number;
    average: number | null;
  }[];
}

export function GradesOverview({
  totalGrades,
  overallAverage,
  bySubject,
}: GradesOverviewProps) {
  const withGrades = bySubject.filter((s) => s.count > 0);
  const overallPercent =
    overallAverage !== null ? (overallAverage / 10) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <GraduationCap className="size-4 text-[var(--color-muted-foreground)]" />
            Notas acadêmicas
          </CardTitle>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Média ponderada normalizada / 10
          </p>
        </div>
        {overallAverage !== null && (
          <div className="text-right">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Geral
            </p>
            <p
              className={cn(
                "font-mono text-2xl font-semibold tabular-nums",
                gradeColorByPercent(overallPercent)
              )}
            >
              {overallAverage.toFixed(1)}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {totalGrades === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Nenhuma nota registrada. Adicione em <a href="/notes" className="underline">/notes</a>.
          </p>
        ) : withGrades.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Suas notas existem mas não estão associadas a matérias ativas.
          </p>
        ) : (
          <ul className="space-y-3">
            {withGrades.map((s) => {
              const pct = s.average !== null ? (s.average / 10) * 100 : 0;
              return (
                <li key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        · {s.count} {s.count === 1 ? "nota" : "notas"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        gradeColorByPercent(pct)
                      )}
                    >
                      {s.average?.toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-1.5"
                    indicatorClassName={
                      pct >= 70
                        ? "bg-emerald-400"
                        : pct >= 50
                          ? "bg-amber-400"
                          : "bg-rose-400"
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
