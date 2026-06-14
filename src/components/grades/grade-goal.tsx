"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setSubjectGradeGoal } from "@/features/subjects/actions";
import type { GradeProjection } from "@/lib/queries";
import { cn } from "@/lib/utils";

const f1 = (n: number) => n.toFixed(1);

/**
 * Meta de nota da matéria: define a média alvo (0–10) e o peso total do período,
 * e mostra quanto ainda precisa tirar pra bater. Aparece na seção de notas.
 */
export function GradeGoal({
  subjectId,
  projection,
}: {
  subjectId: string;
  projection: GradeProjection;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [target, setTarget] = React.useState(
    projection.target !== null ? String(projection.target) : "6"
  );
  const [totalWeight, setTotalWeight] = React.useState(
    projection.totalWeight !== null ? String(projection.totalWeight) : ""
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(clear = false) {
    setSubmitting(true);
    setError(null);
    const result = await setSubjectGradeGoal({
      id: subjectId,
      target: clear ? null : parseFloat(target),
      totalWeight: clear || totalWeight.trim() === "" ? null : parseFloat(totalWeight),
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
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Target className="size-3.5" />
            Meta de nota
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
              Média alvo (0–10)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 text-sm outline-none focus:border-[var(--color-ring)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--color-muted-foreground)]">
              Peso total <span className="opacity-60">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              placeholder="ex: 4"
              className="h-8 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 text-sm outline-none focus:border-[var(--color-ring)]"
            />
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          O peso total é a soma dos pesos de todas as avaliações do período (até as
          que ainda não saíram). Com ele, calculo quanto você precisa tirar no que
          falta pra bater a meta.
        </p>
        {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}
        <div className="mt-3 flex items-center justify-between">
          {projection.target !== null ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-[var(--color-muted-foreground)]"
              onClick={() => void save(true)}
              disabled={submitting}
            >
              Remover meta
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" size="sm" onClick={() => void save(false)} disabled={submitting}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  if (projection.target === null) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setEditing(true)}
      >
        <Target className="size-3.5" />
        Definir meta de nota
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-accent)]/40",
        projection.atRisk
          ? "border-rose-500/40 bg-rose-500/10"
          : "border-[var(--color-border)] bg-[var(--color-background)]"
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {projection.atRisk ? (
          <AlertTriangle className="size-4 shrink-0 text-rose-400" />
        ) : (
          <Target className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold">Meta {f1(projection.target)}</p>
          <p className="truncate text-[11px] text-[var(--color-muted-foreground)]">
            {goalMessage(projection)}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-[11px] text-[var(--color-muted-foreground)] underline-offset-2 hover:underline">
        editar
      </span>
    </button>
  );
}

function goalMessage(p: GradeProjection): string {
  const avg = p.average !== null ? f1(p.average) : "—";
  switch (p.status) {
    case "no-grades":
      return "Sem notas lançadas ainda";
    case "guaranteed":
      return `Garantida! Média atual ${avg}, mesmo zerando o resto`;
    case "impossible": {
      const best =
        p.average !== null && p.totalWeight && p.remainingWeight !== null
          ? (p.average * p.doneWeight + 10 * p.remainingWeight) / p.totalWeight
          : null;
      return best !== null
        ? `Inatingível — o máximo possível agora é ~${f1(best)}`
        : "Inatingível com as notas atuais";
    }
    case "needs":
      return `Precisa de média ${f1(p.requiredOnRemaining ?? 0)} no peso restante (${f1(
        p.remainingWeight ?? 0
      )})`;
    case "reached":
      return `Média atual ${avg} atinge a meta`;
    case "behind":
      return `Média atual ${avg} — abaixo da meta`;
    default:
      return "";
  }
}
