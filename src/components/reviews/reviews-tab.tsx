"use client";

import * as React from "react";
import { Repeat } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { NewReviewForm } from "@/components/reviews/new-review-form";
import { ReviewRow } from "@/components/reviews/review-row";

type SubjectOption = { id: string; name: string; color: string };

type Review = {
  id: string;
  title: string;
  subjectName: string | null;
  subjectColor: string | null;
  scheduledAt: Date;
  interval: number;
};

interface ReviewsTabProps {
  subjects: SubjectOption[];
  overdue: Review[];
  today: Review[];
  upcoming: Review[];
}

export function ReviewsTab({
  subjects,
  overdue,
  today,
  upcoming,
}: ReviewsTabProps) {
  const empty = overdue.length === 0 && today.length === 0 && upcoming.length === 0;

  return (
    <div className="space-y-4">
      <NewReviewForm subjects={subjects} />

      {empty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <Repeat className="size-5 text-[var(--color-muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">Nenhuma revisão agendada</h2>
            <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
              Agende revisões por matéria ou tópico. Quando concluir, a próxima é
              reagendada automaticamente com intervalo dobrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-medium text-rose-300">
                Atrasadas ({overdue.length})
              </p>
              {overdue.map((r) => (
                <ReviewRow key={r.id} review={r} tone="overdue" />
              ))}
            </section>
          )}

          {today.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-medium text-emerald-300">
                Hoje ({today.length})
              </p>
              {today.map((r) => (
                <ReviewRow key={r.id} review={r} tone="today" />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Próximas ({upcoming.length})
              </p>
              {upcoming.map((r) => (
                <ReviewRow key={r.id} review={r} tone="upcoming" />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
