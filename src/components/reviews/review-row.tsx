"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, SkipForward, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  completeReview,
  deleteReview,
  skipReview,
} from "@/features/reviews/actions";
import { cn } from "@/lib/utils";

interface ReviewRowProps {
  review: {
    id: string;
    title: string;
    subjectName: string | null;
    subjectColor: string | null;
    scheduledAt: Date;
    interval: number;
  };
  tone?: "overdue" | "today" | "upcoming";
}

function dateLabel(d: Date, tone: "overdue" | "today" | "upcoming"): string {
  if (tone === "today") return "Hoje";
  const diffDays = Math.round(
    (d.getTime() - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000)
  );
  if (tone === "overdue") {
    const n = Math.abs(diffDays);
    return n === 0 ? "Hoje" : n === 1 ? "Ontem" : `${n} dias atrás`;
  }
  if (diffDays === 1) return "Amanhã";
  if (diffDays < 7) return `Em ${diffDays} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function ReviewRow({ review, tone = "today" }: ReviewRowProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"complete" | "skip" | "delete" | null>(
    null
  );

  async function onComplete() {
    setBusy("complete");
    const result = await completeReview(review.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function onSkip() {
    setBusy("skip");
    const result = await skipReview(review.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function onDelete() {
    if (!confirm(`Deletar "${review.title}"?`)) return;
    setBusy("delete");
    const result = await deleteReview(review.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <Card
      className={cn(
        "group transition-shadow hover:shadow-md",
        tone === "overdue" && "border-rose-500/40"
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {review.subjectColor && (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: review.subjectColor }}
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{review.title}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            {review.subjectName && (
              <>
                <span>{review.subjectName}</span>
                <span>·</span>
              </>
            )}
            <span
              className={cn(
                tone === "overdue" && "text-rose-300",
                tone === "today" && "text-emerald-300"
              )}
            >
              {dateLabel(review.scheduledAt, tone)}
            </span>
            <span>·</span>
            <span>intervalo {review.interval}d</span>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={onComplete}
            disabled={busy !== null}
            aria-label="Concluir"
          >
            {busy === "complete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            disabled={busy !== null}
            aria-label="Pular"
          >
            {busy === "skip" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <SkipForward className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={busy !== null}
            aria-label="Deletar"
          >
            {busy === "delete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
