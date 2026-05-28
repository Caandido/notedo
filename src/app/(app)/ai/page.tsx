"use client";

import * as React from "react";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { FlashcardGenerator } from "@/components/ai/flashcard-generator";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getFlashcardDecks } from "@/lib/queries";
import { getAnthropicKey } from "@/features/ai/actions";

export default function AiPage() {
  const { data: decks, loading } = useRepoQuery(() => getFlashcardDecks(), []);
  const [apiAvailable, setApiAvailable] = React.useState(false);
  React.useEffect(() => {
    setApiAvailable(Boolean(getAnthropicKey()));
  }, []);

  if (loading || !decks) return <PageLoading />;

  return (
    <>
      <Header
        title="Assistente de IA"
        subtitle="Gere flashcards a partir das suas anotações"
      />
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <FlashcardGenerator
          apiAvailable={apiAvailable}
          knownDecks={decks.map((d) => d.deck)}
        />
      </div>
    </>
  );
}
