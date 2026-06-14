"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { setSubjectSemesterGoal } from "@/features/subjects/actions";
import type { GradePointsGoal } from "@/lib/queries";
import { ALL_SEMESTERS, semesterLabel } from "@/lib/semester";
import { cn } from "@/lib/utils";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Meta de PONTOS da matéria no semestre: define os pontos a atingir e mostra
 * quanto você já somou e quanto falta. A meta é por semestre.
 */
export function GradeGoal({
  subjectId,
  semester,
  goal,
}: {
  subjectId: string;
  semester: string;
  goal: GradePointsGoal;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [target, setTarget] = React.useState(
    goal.target !== null ? String(goal.target) : ""
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (semester === ALL_SEMESTERS) {
    return (
      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
        Selecione um semestre específico no topo pra definir e acompanhar a meta de pontos.
      </p>
    );
  }

  async function save(clear = false) {
    setSubmitting(true);
    setError(null);
    const result = await setSubjectSemesterGoal({
      id: subjectId,
      semester,
      target: clear ? null : parseFloat(target),
    });
    setSubmitting(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Target className="size-3.5" />
            Meta de pontos · {semesterLabel(semester)}
          </p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label="Fechar"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
              Pontos a atingir no semestre
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              autoFocus
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="ex: 60"
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--color-ring)]"
            />
          </div>
          <Button size="sm" onClick={() => void save(false)} disabled={submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
        {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}
        {goal.target !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-[var(--color-muted-foreground)]"
            onClick={() => void save(true)}
            disabled={submitting}
          >
            Remover meta
          </Button>
        )}
      </div>
    );
  }

  if (goal.target === null) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setEditing(true)}
      >
        <Target className="size-3.5" />
        Definir meta de pontos do semestre
      </Button>
    );
  }

  const pct = goal.target > 0 ? Math.min(100, (goal.accumulated / goal.target) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "block w-full rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-accent)]/40",
        goal.reached
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-[var(--color-border)] bg-[var(--color-background)]"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {goal.reached ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Target className="size-3.5 text-[var(--color-muted-foreground)]" />
          )}
          Meta {fmt(goal.target)} pts · {semesterLabel(semester)}
        </span>
        <span className="text-[11px] text-[var(--color-muted-foreground)] underline-offset-2 hover:underline">
          editar
        </span>
      </div>
      <Progress
        value={pct}
        className="h-1.5"
        indicatorClassName={goal.reached ? "bg-emerald-400" : "bg-amber-400"}
      />
      <p className="mt-1.5 text-[11px] text-[var(--color-muted-foreground)]">
        {goal.reached
          ? `Você somou ${fmt(goal.accumulated)} pts — meta atingida! 🎉`
          : `Você tem ${fmt(goal.accumulated)} pts · faltam ${fmt(goal.remaining ?? 0)} pra ${fmt(goal.target)}`}
      </p>
    </button>
  );
}
