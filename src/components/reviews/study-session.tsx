"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { gradeFlashcard, type Quality } from "@/features/flashcards/actions";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  front: string;
  back: string;
  deck: string | null;
  ease: number;
  interval: number;
};

interface StudySessionProps {
  cards: Card[];
  deck?: string;
}

const GRADES: { quality: Quality; label: string; key: string; tone: string }[] =
  [
    {
      quality: 0,
      label: "Errei",
      key: "1",
      tone: "border-rose-500/40 hover:bg-rose-500/10 text-rose-300",
    },
    {
      quality: 1,
      label: "Difícil",
      key: "2",
      tone: "border-amber-500/40 hover:bg-amber-500/10 text-amber-300",
    },
    {
      quality: 2,
      label: "Bom",
      key: "3",
      tone: "border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300",
    },
    {
      quality: 3,
      label: "Fácil",
      key: "4",
      tone: "border-sky-500/40 hover:bg-sky-500/10 text-sky-300",
    },
  ];

export function StudySession({ cards, deck }: StudySessionProps) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [counts, setCounts] = React.useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const current = cards[index];
  const total = cards.length;
  const done = index >= total;

  const reveal = React.useCallback(() => setRevealed(true), []);

  const grade = React.useCallback(
    async (quality: Quality) => {
      if (!current || submitting) return;
      setSubmitting(true);
      const result = await gradeFlashcard(current.id, quality);
      setSubmitting(false);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setCounts((c) => ({
        again: c.again + (quality === 0 ? 1 : 0),
        hard: c.hard + (quality === 1 ? 1 : 0),
        good: c.good + (quality === 2 ? 1 : 0),
        easy: c.easy + (quality === 3 ? 1 : 0),
      }));
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    [current, submitting]
  );

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        reveal();
        return;
      }
      if (revealed) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) {
          e.preventDefault();
          grade(g.quality);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, done, reveal, grade]);

  if (done) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 p-6 pt-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
          <Sparkles className="size-6" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Sessão concluída
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {total} cartão{total === 1 ? "" : "s"} revisado{total === 1 ? "" : "s"}
            {deck ? ` no deck "${deck}"` : ""}
          </p>
        </div>

        <Card className="w-full">
          <CardContent className="grid grid-cols-4 gap-4 p-5">
            {[
              { label: "Errou", value: counts.again, tone: "text-rose-300" },
              { label: "Difícil", value: counts.hard, tone: "text-amber-300" },
              { label: "Bom", value: counts.good, tone: "text-emerald-300" },
              { label: "Fácil", value: counts.easy, tone: "text-sky-300" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={cn("text-xl font-semibold tabular-nums", s.tone)}>
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                  {s.label}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/reviews">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
          <Button onClick={() => router.refresh()}>Estudar mais</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 pt-10">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/reviews">
            <ArrowLeft className="size-3.5" />
            Sair
          </Link>
        </Button>
        <div className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {index + 1} / {total}
          {deck && <span className="ml-2">· {deck}</span>}
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full bg-[var(--color-chart-1)] transition-[width] duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <Card className="min-h-[280px]">
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Frente
          </p>
          <p className="whitespace-pre-wrap text-xl font-medium leading-relaxed">
            {current.front}
          </p>

          {revealed && (
            <>
              <div className="my-2 h-px w-full bg-[var(--color-border)]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Verso
              </p>
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-[var(--color-foreground)]">
                {current.back}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {!revealed ? (
        <div className="flex justify-center">
          <Button size="lg" onClick={reveal} className="gap-2 px-8">
            <Eye className="size-4" />
            Mostrar resposta
            <kbd className="ml-2 rounded border border-[var(--color-border)]/40 bg-[var(--color-background)]/30 px-1.5 font-mono text-[10px]">
              Espaço
            </kbd>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADES.map((g) => (
            <button
              key={g.quality}
              onClick={() => grade(g.quality)}
              disabled={submitting}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border bg-transparent p-3 text-sm font-medium transition-colors disabled:opacity-50",
                g.tone
              )}
            >
              <span>{g.label}</span>
              <kbd className="rounded border border-current/30 px-1.5 font-mono text-[10px] opacity-70">
                {g.key}
              </kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
