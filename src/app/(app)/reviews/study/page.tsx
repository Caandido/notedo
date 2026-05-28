import Link from "next/link";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudySession } from "@/components/reviews/study-session";
import { getDueFlashcards } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface StudyPageProps {
  searchParams: Promise<{ deck?: string }>;
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  const { deck } = await searchParams;
  const cards = await getDueFlashcards(deck);

  if (cards.length === 0) {
    return (
      <>
        <Header
          title="Estudar flashcards"
          subtitle={deck ?? "Todos os decks"}
        />
        <div className="mx-auto max-w-xl p-6 pt-12">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <h2 className="text-lg font-semibold">Nada devido por agora</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                {deck
                  ? `O deck "${deck}" não tem cartões devidos.`
                  : "Você está em dia com seus flashcards."}{" "}
                Volte mais tarde ou crie novos cartões.
              </p>
              <Button asChild className="mt-2">
                <Link href="/reviews">Voltar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Estudar flashcards"
        subtitle={`${cards.length} devido${cards.length === 1 ? "" : "s"}${deck ? ` · ${deck}` : ""}`}
      />
      <StudySession cards={cards} deck={deck} />
    </>
  );
}
