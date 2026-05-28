import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatHours } from "@/lib/utils";
import type { Subject } from "@/types";

interface SubjectsCardProps {
  subjects: Subject[];
}

export function SubjectsCard({ subjects }: SubjectsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="size-4 text-[var(--color-muted-foreground)]" />
          Matérias recentes
        </CardTitle>
        <Link
          href="/subjects"
          className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          Ver todas
          <ArrowUpRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {subjects.map((subject) => (
          <div key={subject.id} className="group space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm font-medium">{subject.name}</span>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {formatHours(subject.totalSeconds)}
              </span>
            </div>
            <Progress
              value={subject.progress}
              className="h-1.5"
              indicatorClassName=""
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
