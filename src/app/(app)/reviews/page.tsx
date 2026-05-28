"use client";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { ReviewsView } from "@/components/reviews/reviews-view";
import { useRepoQuery } from "@/lib/db/use-repo";
import {
  getFlashcardDecks,
  getReviewsForUser,
  getSubjectsForUser,
} from "@/lib/queries";

export default function ReviewsPage() {
  const reviews = useRepoQuery(() => getReviewsForUser(), []);
  const decks = useRepoQuery(() => getFlashcardDecks(), []);
  const subjects = useRepoQuery(() => getSubjectsForUser(), []);

  if (
    reviews.loading || !reviews.data ||
    decks.loading || !decks.data ||
    subjects.loading || !subjects.data
  ) {
    return <PageLoading />;
  }

  const dueToday = reviews.data.overdue.length + reviews.data.today.length;
  const dueFlashcards = decks.data.reduce((acc, d) => acc + d.due, 0);

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
        subjects={subjects.data.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }))}
        overdue={reviews.data.overdue}
        today={reviews.data.today}
        upcoming={reviews.data.upcoming}
        decks={decks.data}
      />
    </>
  );
}
