"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateSubject } from "@/features/subjects/actions";
import { cn } from "@/lib/utils";

const SUBJECT_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f472b6",
  "#22d3ee",
  "#94a3b8",
];

const PRIORITIES = [
  { id: "low" as const, label: "Baixa" },
  { id: "medium" as const, label: "Média" },
  { id: "high" as const, label: "Alta" },
];

interface EditSubjectFormProps {
  subject: {
    id: string;
    name: string;
    color: string;
    priority: "low" | "medium" | "high";
    tags: string[];
  };
}

export function EditSubjectForm({ subject }: EditSubjectFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(subject.name);
  const [color, setColor] = React.useState(subject.color);
  const [priority, setPriority] = React.useState(subject.priority);
  const [tagsRaw, setTagsRaw] = React.useState(subject.tags.join(", "));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setName(subject.name);
    setColor(subject.color);
    setPriority(subject.priority);
    setTagsRaw(subject.tags.join(", "));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Nome obrigatório.");
    setSubmitting(true);
    setError(null);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const result = await updateSubject({
      id: subject.id,
      name,
      color,
      priority,
      tags,
    });
    setSubmitting(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Pencil className="size-3.5" />
        Editar
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Editar matéria</h3>
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
              Nome
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Cor
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-md border-2 transition-transform hover:scale-110",
                    color === c
                      ? "border-[var(--color-foreground)]"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Prioridade
            </label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-1.5 text-xs transition-colors",
                    priority === p.id
                      ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  aria-pressed={priority === p.id}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Tags
            </label>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="separadas por vírgula"
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
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
