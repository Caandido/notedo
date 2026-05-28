"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createNote } from "@/features/notes/actions";

export function NewNoteForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Título obrigatório.");
    setSubmitting(true);
    setError(null);
    const result = await createNote({ title });
    setSubmitting(false);
    if (result.ok) {
      setOpen(false);
      setTitle("");
      router.push(`/notes/${result.id}`);
    } else {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova nota
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
          placeholder="Título da nota"
          maxLength={120}
          className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? <Loader2 className="size-3.5 animate-spin" /> : "Criar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          setOpen(false);
          setTitle("");
          setError(null);
        }}
        aria-label="Cancelar"
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}
