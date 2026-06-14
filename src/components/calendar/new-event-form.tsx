"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createEvent } from "@/features/events/actions";
import { EVENT_LABELS, type EventType } from "@/components/calendar/event-styles";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; name: string; color: string };

interface NewEventFormProps {
  subjects: SubjectOption[];
  defaultDate?: string;
  size?: "sm" | "default";
}

function todayInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const TYPES: EventType[] = ["exam", "task", "class", "custom"];

export function NewEventForm({
  subjects,
  defaultDate,
  size = "default",
}: NewEventFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<EventType>("exam");
  const [date, setDate] = React.useState(defaultDate ?? todayInput());
  const [subjectIds, setSubjectIds] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (defaultDate && !open) setDate(defaultDate);
  }, [defaultDate, open]);

  function close() {
    setOpen(false);
    setTitle("");
    setType("exam");
    setDate(defaultDate ?? todayInput());
    setSubjectIds([]);
    setNotes("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Título obrigatório.");
    setSubmitting(true);
    setError(null);
    const scheduledAt = new Date(`${date}T09:00:00`).toISOString();
    const result = await createEvent({
      title,
      type,
      date: scheduledAt,
      subjectIds,
      notes,
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
      <Button
        onClick={() => setOpen(true)}
        size={size === "sm" ? "sm" : "default"}
        className="gap-1.5"
      >
        <Plus className="size-3.5" />
        Novo evento
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Novo evento</h3>
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
              Título
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Prova de Cálculo I"
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
                  {EVENT_LABELS[t]}
                </button>
              ))}
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

          {subjects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Matérias <span className="opacity-60">(pode escolher várias)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const active = subjectIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      )}
                      aria-pressed={active}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Notas <span className="opacity-60">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes, lembretes..."
              rows={2}
              maxLength={1000}
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
              Criar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
