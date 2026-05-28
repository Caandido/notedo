"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createFlashcard } from "@/features/flashcards/actions";

interface NewFlashcardFormProps {
  knownDecks: string[];
}

export function NewFlashcardForm({ knownDecks }: NewFlashcardFormProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [deck, setDeck] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setFront("");
    setBack("");
    setDeck("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim())
      return setError("Frente e verso são obrigatórios.");
    setSubmitting(true);
    setError(null);
    const result = await createFlashcard({
      front,
      back,
      deck: deck.trim() || undefined,
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
        Novo flashcard
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Novo flashcard</h3>
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
              Frente (pergunta)
            </label>
            <textarea
              autoFocus
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="ex: Qual a derivada de sen(x)?"
              maxLength={600}
              rows={2}
              className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Verso (resposta)
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="ex: cos(x)"
              maxLength={600}
              rows={2}
              className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Deck <span className="opacity-60">(opcional)</span>
            </label>
            <input
              list="known-decks"
              type="text"
              value={deck}
              onChange={(e) => setDeck(e.target.value)}
              placeholder="ex: Cálculo I"
              maxLength={60}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
            <datalist id="known-decks">
              {knownDecks.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
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
