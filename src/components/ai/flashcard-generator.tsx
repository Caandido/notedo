"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  generateFlashcardsFromText,
  saveGeneratedCards,
  type GeneratedCard,
} from "@/features/ai/actions";

interface FlashcardGeneratorProps {
  apiAvailable: boolean;
  knownDecks: string[];
}

type GenState = "idle" | "generating" | "ready" | "saving" | "saved" | "error";

export function FlashcardGenerator({
  apiAvailable,
  knownDecks,
}: FlashcardGeneratorProps) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [deck, setDeck] = React.useState("");
  const [state, setState] = React.useState<GenState>("idle");
  const [cards, setCards] = React.useState<GeneratedCard[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [savedCount, setSavedCount] = React.useState(0);

  async function onGenerate() {
    setState("generating");
    setError(null);
    const result = await generateFlashcardsFromText(text);
    if (result.ok) {
      setCards(result.cards);
      setState("ready");
    } else {
      setState("error");
      setError(result.error);
    }
  }

  function removeCard(i: number) {
    setCards((cs) => cs.filter((_, idx) => idx !== i));
  }

  function reset() {
    setCards([]);
    setText("");
    setState("idle");
    setError(null);
  }

  async function onSave() {
    setState("saving");
    const result = await saveGeneratedCards({ cards, deck });
    if (result.ok) {
      setSavedCount(result.count);
      setState("saved");
      router.refresh();
      setTimeout(reset, 2500);
    } else {
      setState("error");
      setError(result.error);
    }
  }

  if (!apiAvailable) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--color-muted-foreground)]" />
            <h3 className="text-sm font-semibold">
              IA não configurada
            </h3>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Para usar geração de flashcards, adicione a variável de ambiente
            <code className="mx-1 rounded bg-[var(--color-secondary)] px-1 py-0.5 font-mono text-xs">
              ANTHROPIC_API_KEY
            </code>
            no Vercel (Settings → Environment Variables) e localmente em{" "}
            <code className="mx-1 rounded bg-[var(--color-secondary)] px-1 py-0.5 font-mono text-xs">
              .env
            </code>
            . A chave fica disponível em{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-foreground)] underline-offset-4 hover:underline"
            >
              console.anthropic.com
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-[var(--color-muted-foreground)]" />
            Cole suas anotações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole o texto: resumo, capítulo, definições... A IA extrai os conceitos atômicos e gera entre 5 e 12 flashcards."
            rows={8}
            maxLength={8000}
            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {text.length} / 8000 caracteres
            </span>
            <div className="flex items-center gap-2">
              <input
                list="ai-decks"
                type="text"
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
                placeholder="Deck (opcional)"
                maxLength={60}
                className="h-9 w-44 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
              <datalist id="ai-decks">
                {knownDecks.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <Button
                onClick={onGenerate}
                disabled={
                  state === "generating" ||
                  state === "saving" ||
                  text.trim().length < 30
                }
                className="gap-1.5"
              >
                {state === "generating" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Gerar
              </Button>
            </div>
          </div>
          {error && state === "error" && (
            <p className="text-xs text-rose-300">{error}</p>
          )}
        </CardContent>
      </Card>

      {(state === "ready" || state === "saving" || state === "saved") &&
        cards.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Pré-visualização
                <span className="ml-2 text-xs font-normal text-[var(--color-muted-foreground)]">
                  {cards.length} cartão{cards.length === 1 ? "" : "s"}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="size-3.5" />
                  Recomeçar
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={state === "saving" || state === "saved"}
                  className="gap-1.5"
                >
                  {state === "saving" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : state === "saved" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {state === "saved"
                    ? `${savedCount} salvos`
                    : `Salvar ${cards.length}`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {cards.map((c, i) => (
                  <li
                    key={i}
                    className="group flex items-start gap-3 rounded-md border border-[var(--color-border)] p-3"
                  >
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      {i + 1}
                    </Badge>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium">{c.front}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {c.back}
                      </p>
                    </div>
                    <button
                      onClick={() => removeCard(i)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--color-muted-foreground)] hover:text-rose-300"
                      aria-label="Remover"
                      disabled={state === "saving" || state === "saved"}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
