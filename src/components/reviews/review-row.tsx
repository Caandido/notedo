"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Pencil,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  completeReview,
  deleteReview,
  skipReview,
  updateReview,
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

function toDateInput(d: Date): string {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export function ReviewRow({ review, tone = "today" }: ReviewRowProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(review.title);
  const [date, setDate] = React.useState(toDateInput(review.scheduledAt));
  const [busy, setBusy] = React.useState<
    "complete" | "skip" | "delete" | "save" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

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

  async function onSave() {
    if (!title.trim()) return setError("Título obrigatório.");
    setBusy("save");
    setError(null);
    const scheduledAt = new Date(`${date}T09:00:00`).toISOString();
    const result = await updateReview({ id: review.id, title, scheduledAt });
    setBusy(null);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setTitle(review.title);
    setDate(toDateInput(review.scheduledAt));
    setError(null);
  }

  return (
    <Card
      className={cn(
        "group transition-shadow hover:shadow-md",
        tone === "overdue" && !editing && "border-rose-500/40"
      )}
    >
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                maxLength={120}
                className="h-9 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={busy === "save"}
              >
                <X className="size-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={busy === "save"}
                className="gap-1.5"
              >
                {busy === "save" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
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
                onClick={() => setEditing(true)}
                disabled={busy !== null}
                aria-label="Editar"
              >
                <Pencil className="size-3.5" />
              </Button>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
