import { Header } from "@/components/layout/header";
import { ReviewsView } from "@/components/reviews/reviews-view";
import {
  getFlashcardDecks,
  getReviewsForUser,
  getSubjectsForUser,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const [reviews, decks, subjects] = await Promise.all([
    getReviewsForUser(),
    getFlashcardDecks(),
    getSubjectsForUser(),
  ]);

  const dueToday = reviews.overdue.length + reviews.today.length;
  const dueFlashcards = decks.reduce((acc, d) => acc + d.due, 0);

  return (
    <>
      <Header
        title="Revisões"
        subtitle={
          dueToday + dueFlashcards === 0
            ? "Tudo em dia"
            : `${dueToday} revisão${dueToday === 1 ? "" : "ões"} · ${dueFlashcards} flashcard${dueFlashcards === 1 ? "" : "s"} devid${dueFlashcards === 1 ? "o" : "os"}`
        }
      />
      <ReviewsView
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }))}
        overdue={reviews.overdue}
        today={reviews.today}
        upcoming={reviews.upcoming}
        decks={decks}
      />
    </>
  );
}
