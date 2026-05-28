import { Header } from "@/components/layout/header";
import { FlashcardGenerator } from "@/components/ai/flashcard-generator";
import { getFlashcardDecks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const decks = await getFlashcardDecks();
  const apiAvailable = Boolean(process.env.ANTHROPIC_API_KEY);

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
