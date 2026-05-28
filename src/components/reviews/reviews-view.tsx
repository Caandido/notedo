"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { ReviewsTab } from "@/components/reviews/reviews-tab";
import { FlashcardsTab } from "@/components/reviews/flashcards-tab";

type SubjectOption = { id: string; name: string; color: string };
type Review = {
  id: string;
  title: string;
  subjectName: string | null;
  subjectColor: string | null;
  scheduledAt: Date;
  interval: number;
};
type Deck = { deck: string; total: number; due: number };

interface ReviewsViewProps {
  subjects: SubjectOption[];
  overdue: Review[];
  today: Review[];
  upcoming: Review[];
  decks: Deck[];
}

const TABS = [
  { id: "reviews", label: "Revisões" },
  { id: "flashcards", label: "Flashcards" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReviewsView({
  subjects,
  overdue,
  today,
  upcoming,
  decks,
}: ReviewsViewProps) {
  const [tab, setTab] = React.useState<TabId>(
    overdue.length + today.length > 0 ? "reviews" : "flashcards"
  );

  return (
    <div className="space-y-5 p-6">
      <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
            aria-pressed={tab === t.id}
          >
            {t.label}
            {t.id === "reviews" && overdue.length + today.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] text-emerald-300">
                {overdue.length + today.length}
              </span>
            )}
            {t.id === "flashcards" &&
              decks.reduce((acc, d) => acc + d.due, 0) > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] text-emerald-300">
                  {decks.reduce((acc, d) => acc + d.due, 0)}
                </span>
              )}
          </button>
        ))}
      </div>

      {tab === "reviews" ? (
        <ReviewsTab
          subjects={subjects}
          overdue={overdue}
          today={today}
          upcoming={upcoming}
        />
      ) : (
        <FlashcardsTab decks={decks} />
      )}
    </div>
  );
}
