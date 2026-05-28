"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createGrade, updateGrade } from "@/features/grades/actions";
import {
  GRADE_TYPE_LABEL,
  type GradeType,
} from "@/components/grades/grade-styles";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; name: string; color: string };

interface GradeFormProps {
  subjects: SubjectOption[];
  defaultSubjectId?: string;
  /** Quando informado, abre em modo de edição */
  editing?: {
    id: string;
    subjectId: string;
    title: string;
    type: GradeType;
    score: number;
    maxScore: number;
    weight: number;
    date: Date | string;
    comments: string | null;
  };
  onClose?: () => void;
}

function todayInput(d?: Date | string): string {
  const date = d ? new Date(d) : new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

const TYPES: GradeType[] = ["exam", "assignment", "quiz", "other"];

export function GradeForm({
  subjects,
  defaultSubjectId,
  editing,
  onClose,
}: GradeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(editing);
  const [open, setOpen] = React.useState(isEdit);
  const [subjectId, setSubjectId] = React.useState(
    editing?.subjectId ?? defaultSubjectId ?? ""
  );
  const [title, setTitle] = React.useState(editing?.title ?? "");
  const [type, setType] = React.useState<GradeType>(editing?.type ?? "exam");
  const [score, setScore] = React.useState(
    editing ? editing.score.toString() : ""
  );
  const [maxScore, setMaxScore] = React.useState(
    editing ? editing.maxScore.toString() : "10"
  );
  const [weight, setWeight] = React.useState(
    editing ? editing.weight.toString() : "1"
  );
  const [date, setDate] = React.useState(todayInput(editing?.date));
  const [comments, setComments] = React.useState(editing?.comments ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    if (isEdit && onClose) {
      onClose();
      return;
    }
    setOpen(false);
    setSubjectId(defaultSubjectId ?? "");
    setTitle("");
    setType("exam");
    setScore("");
    setMaxScore("10");
    setWeight("1");
    setDate(todayInput());
    setComments("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) return setError("Selecione uma matéria.");
    if (!title.trim()) return setError("Título obrigatório.");
    const n = parseFloat(score);
    const m = parseFloat(maxScore);
    const w = parseFloat(weight);
    if (!Number.isFinite(n) || n < 0) return setError("Nota inválida.");
    if (!Number.isFinite(m) || m <= 0) return setError("Máxima inválida.");
    if (!Number.isFinite(w) || w <= 0) return setError("Peso inválido.");

    setSubmitting(true);
    setError(null);

    const payload = {
      subjectId,
      title,
      type,
      score: n,
      maxScore: m,
      weight: w,
      date: new Date(`${date}T12:00:00`).toISOString(),
      comments: comments.trim() || undefined,
    };

    const result = editing
      ? await updateGrade({ id: editing.id, ...payload })
      : await createGrade(payload);

    setSubmitting(false);
    if (result.ok) {
      close();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (!open && !isEdit) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova nota
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">
              {isEdit ? "Editar nota" : "Nova nota"}
            </h3>
            <button
              type="button"
              onClick={close}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </button>
          </div>

          {subjects.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Crie uma matéria primeiro em <a href="/subjects" className="underline">/subjects</a>.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Matéria
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              >
                <option value="">— Selecione —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Título
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Prova 1, Trabalho final"
              maxLength={120}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Tipo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs transition-colors",
                    type === t
                      ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  aria-pressed={type === t}
                >
                  {GRADE_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Nota
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="8.5"
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Máxima
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Peso
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Comentário <span className="opacity-60">(opcional)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Observações sobre o que estudou, erros etc"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
