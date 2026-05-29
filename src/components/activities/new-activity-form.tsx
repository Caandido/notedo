"use client";

import * as React from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createActivity } from "@/features/activities/actions";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getSubjectsForUser } from "@/lib/queries";
import type { ActivityType } from "@/lib/db/schema";
import { ACTIVITY_TYPES, TYPE_LABELS } from "./activity-styles";

const inputCls =
  "h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]";

export function NewActivityForm() {
  const { data: subjects } = useRepoQuery(() => getSubjectsForUser(), []);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<ActivityType>("ATIVIDADE");
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setTitle("");
    setType("ATIVIDADE");
    setSubjectId("");
    setDueDate("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Título obrigatório.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createActivity({
      title,
      type,
      subjectId: subjectId || null,
      dueDate: dueDate || null,
    });
    setSubmitting(false);
    if (res.ok) close();
    else setError(res.error);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova atividade
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Nova atividade</h3>
            <button
              type="button"
              onClick={close}
              aria-label="Cancelar"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Título
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Redação sobre meio ambiente"
              maxLength={160}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Tipo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.map((t) => (
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
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Matéria <span className="opacity-60">(opcional)</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={inputCls}
              >
                <option value="">Nenhuma</option>
                {(subjects ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Prazo <span className="opacity-60">(opcional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Criar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
