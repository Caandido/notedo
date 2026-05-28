"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeForm } from "@/components/grades/grade-form";
import {
  GRADE_TYPE_LABEL,
  GRADE_TYPE_TONE,
  gradeColorByPercent,
} from "@/components/grades/grade-styles";
import { deleteGrade } from "@/features/grades/actions";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; name: string; color: string };

interface GradeRowProps {
  grade: {
    id: string;
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    title: string;
    type: "exam" | "assignment" | "quiz" | "other";
    score: number;
    maxScore: number;
    weight: number;
    date: Date | string;
    comments: string | null;
    percent: number;
  };
  subjects: SubjectOption[];
  hideSubject?: boolean;
}

export function GradeRow({ grade, subjects, hideSubject }: GradeRowProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function onDelete() {
    if (!confirm(`Deletar "${grade.title}"?`)) return;
    setDeleting(true);
    const result = await deleteGrade(grade.id);
    setDeleting(false);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  if (editing) {
    return (
      <GradeForm
        subjects={subjects}
        editing={grade}
        onClose={() => setEditing(false)}
      />
    );
  }

  const tone = GRADE_TYPE_TONE[grade.type];
  const dateLabel = new Date(grade.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md"
          style={{
            backgroundColor: `${grade.subjectColor}1f`,
            border: `1px solid ${grade.subjectColor}55`,
          }}
        >
          <span
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              gradeColorByPercent(grade.percent)
            )}
          >
            {grade.score % 1 === 0
              ? grade.score.toFixed(0)
              : grade.score.toFixed(1)}
          </span>
          <span className="-mt-0.5 text-[9px] text-[var(--color-muted-foreground)]">
            / {grade.maxScore % 1 === 0 ? grade.maxScore.toFixed(0) : grade.maxScore.toFixed(1)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{grade.title}</h3>
            <Badge
              variant="outline"
              className={cn("text-[10px]", tone.text)}
            >
              <span className={cn("mr-1 size-1.5 rounded-full", tone.dot)} />
              {GRADE_TYPE_LABEL[grade.type]}
            </Badge>
            {grade.weight !== 1 && (
              <Badge variant="outline" className="text-[10px]">
                peso {grade.weight}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            {!hideSubject && (
              <>
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: grade.subjectColor }}
                />
                <span>{grade.subjectName}</span>
                <span>·</span>
              </>
            )}
            <span>{dateLabel}</span>
            <span>·</span>
            <span className={cn(gradeColorByPercent(grade.percent))}>
              {grade.percent.toFixed(0)}%
            </span>
          </div>
          {grade.comments && (
            <p className="mt-1 truncate text-xs italic text-[var(--color-muted-foreground)]">
              {grade.comments}
            </p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
            disabled={deleting}
            aria-label="Editar"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Deletar"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
