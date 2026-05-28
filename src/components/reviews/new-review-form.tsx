"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createReview } from "@/features/reviews/actions";

type SubjectOption = { id: string; name: string; color: string };

interface NewReviewFormProps {
  subjects: SubjectOption[];
}

function todayInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function NewReviewForm({ subjects }: NewReviewFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [date, setDate] = React.useState(todayInput());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setTitle("");
    setSubjectId("");
    setDate(todayInput());
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Título obrigatório.");
    setSubmitting(true);
    setError(null);
    const scheduledAt = new Date(`${date}T09:00:00`).toISOString();
    const result = await createReview({
      subjectId: subjectId || null,
      title,
      scheduledAt,
    });
    setSubmitting(false);
    if (result.ok) {
      close();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova revisão
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Nova revisão</h3>
            <button
              type="button"
              onClick={close}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Tópico
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Limites e continuidade"
              maxLength={120}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          {subjects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Matéria
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              >
                <option value="">— Sem matéria —</option>
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
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
