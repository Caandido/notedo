"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createTopic } from "@/features/topics/actions";

interface NewTopicFormProps {
  subjectId: string;
  parentId?: string | null;
  variant?: "primary" | "inline";
  label?: string;
}

export function NewTopicForm({
  subjectId,
  parentId = null,
  variant = "primary",
  label = "Novo tópico",
}: NewTopicFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setTitle("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Título obrigatório.");
    setSubmitting(true);
    setError(null);
    try {
      const result = await createTopic({ subjectId, parentId, title });
      if (result.ok) {
        close();
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar tópico.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    if (variant === "inline") {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <Plus className="size-3" />
          subtópico
        </button>
      );
    }
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-start gap-2">
      <div className="flex-1 space-y-1">
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do tópico"
          maxLength={120}
          className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? <Loader2 className="size-3.5 animate-spin" /> : "OK"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={close}
        aria-label="Cancelar"
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}
