"use client";

import * as React from "react";
import Link from "next/link";
import { Layers, Play } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewFlashcardForm } from "@/components/reviews/new-flashcard-form";

type Deck = { deck: string; total: number; due: number };

interface FlashcardsTabProps {
  decks: Deck[];
}

export function FlashcardsTab({ decks }: FlashcardsTabProps) {
  const totalDue = decks.reduce((acc, d) => acc + d.due, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <NewFlashcardForm knownDecks={decks.map((d) => d.deck)} />
        {totalDue > 0 && (
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/reviews/study">
              <Play className="size-3.5 fill-current" />
              Estudar todos ({totalDue})
            </Link>
          </Button>
        )}
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <Layers className="size-5 text-[var(--color-muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">Nenhum flashcard ainda</h2>
            <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
              Crie cartões com frente e verso. Eles são reapresentados via
              repetição espaçada (SM-2 simplificado) conforme você avalia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <Card key={d.deck} className="group transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold">{d.deck}</h3>
                  {d.due > 0 ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-transparent">
                      {d.due} devidos
                    </Badge>
                  ) : (
                    <Badge variant="outline">em dia</Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {d.total} {d.total === 1 ? "cartão" : "cartões"} no total
                </p>
                <Button
                  asChild
                  size="sm"
                  variant={d.due > 0 ? "default" : "outline"}
                  className="w-full gap-1.5"
                  disabled={d.due === 0}
                >
                  <Link
                    href={`/reviews/study?deck=${encodeURIComponent(d.deck)}`}
                  >
                    <Play className="size-3 fill-current" />
                    {d.due > 0 ? `Estudar (${d.due})` : "Nenhum devido"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
