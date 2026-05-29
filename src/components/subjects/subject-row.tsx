"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { archiveSubject } from "@/features/subjects/actions";
import { formatHours } from "@/lib/utils";

interface SubjectRowProps {
  subject: {
    id: string;
    name: string;
    color: string;
    priority: "low" | "medium" | "high";
    progress: number;
    tags: string[];
    totalSeconds: number;
    sessionCount: number;
  };
}

const priorityLabel = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function SubjectRow({ subject }: SubjectRowProps) {
  const router = useRouter();
  const [archiving, setArchiving] = React.useState(false);

  async function onArchive(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Arquivar "${subject.name}"?`)) return;
    setArchiving(true);
    const result = await archiveSubject(subject.id);
    setArchiving(false);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <Link
      href={`/subject?id=${subject.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded-xl"
    >
      <Card className="group transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className="size-9 shrink-0 rounded-md"
            style={{
              backgroundColor: `${subject.color}33`,
              border: `1px solid ${subject.color}66`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{subject.name}</h3>
              <Badge variant="outline" className="text-[10px]">
                {priorityLabel[subject.priority]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
              <span>{formatHours(subject.totalSeconds)}</span>
              <span>·</span>
              <span>
                {subject.sessionCount}{" "}
                {subject.sessionCount === 1 ? "sessão" : "sessões"}
              </span>
              {subject.tags.length > 0 && (
                <>
                  <span>·</span>
                  <span className="truncate">{subject.tags.join(", ")}</span>
                </>
              )}
            </div>
          </div>

          <div className="hidden w-32 shrink-0 md:block">
            <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--color-muted-foreground)]">
              <span>Progresso</span>
              <span>{subject.progress}%</span>
            </div>
            <Progress value={subject.progress} className="h-1.5" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onArchive}
            disabled={archiving}
            aria-label="Arquivar"
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            {archiving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Archive className="size-4" />
            )}
          </Button>

          <ChevronRight className="size-4 text-[var(--color-muted-foreground)] opacity-50 transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
