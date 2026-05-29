import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { gradeColorByPercent } from "@/components/grades/grade-styles";
import { cn } from "@/lib/utils";

interface SubjectAverageCardProps {
  subject: {
    id: string;
    name: string;
    color: string;
    count: number;
    average: number | null;
  };
}

export function SubjectAverageCard({ subject }: SubjectAverageCardProps) {
  const avg = subject.average;
  const hasGrades = subject.count > 0 && avg !== null;
  const percent = hasGrades ? (avg / 10) * 100 : 0;

  return (
    <Link href={`/subject?id=${subject.id}`} className="block">
      <Card className="group h-full transition-shadow hover:shadow-md">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              <h3 className="truncate text-sm font-semibold">{subject.name}</h3>
            </div>
            {hasGrades && (
              <span
                className={cn(
                  "shrink-0 font-mono text-lg font-semibold tabular-nums",
                  gradeColorByPercent(percent)
                )}
              >
                {avg!.toFixed(1)}
              </span>
            )}
          </div>

          {hasGrades ? (
            <>
              <Progress
                value={percent}
                className="h-1.5"
                indicatorClassName={
                  percent >= 70
                    ? "bg-emerald-400"
                    : percent >= 50
                      ? "bg-amber-400"
                      : "bg-rose-400"
                }
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {subject.count} {subject.count === 1 ? "nota" : "notas"} ·
                média ponderada / 10
              </p>
            </>
          ) : (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sem notas ainda
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
