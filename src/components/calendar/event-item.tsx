"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteEvent,
  toggleEventDone,
} from "@/features/events/actions";
import {
  EVENT_COLORS,
  EVENT_LABELS,
  type EventType,
} from "@/components/calendar/event-styles";
import { cn } from "@/lib/utils";

interface EventItemProps {
  event: {
    id: string;
    title: string;
    type: EventType;
    done: boolean;
    subjectName: string | null;
    subjectColor: string | null;
    notes: string | null;
  };
}

export function EventItem({ event }: EventItemProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"toggle" | "delete" | null>(null);

  const style = EVENT_COLORS[event.type];

  async function onToggle() {
    setBusy("toggle");
    const result = await toggleEventDone(event.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function onDelete() {
    if (!confirm(`Deletar "${event.title}"?`)) return;
    setBusy("delete");
    const result = await deleteEvent(event.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <li
      className={cn(
        "group flex items-start gap-2 rounded-md border bg-transparent p-2 text-xs transition-colors",
        style.border,
        event.done && "opacity-50"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={busy !== null}
        aria-label={event.done ? "Marcar como pendente" : "Marcar como feito"}
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
          event.done
            ? "border-emerald-500/60 bg-emerald-500/30 text-emerald-200"
            : "border-[var(--color-border)] hover:bg-[var(--color-accent)]"
        )}
      >
        {busy === "toggle" ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : event.done ? (
          <Check className="size-2.5" />
        ) : null}
      </button>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", style.dot)} />
          <span className={cn("text-[9px] uppercase tracking-wider", style.text)}>
            {EVENT_LABELS[event.type]}
          </span>
          {event.subjectName && (
            <>
              <span className="text-[var(--color-muted-foreground)]">·</span>
              <span
                className="truncate text-[var(--color-muted-foreground)]"
                style={
                  event.subjectColor ? { color: event.subjectColor } : undefined
                }
              >
                {event.subjectName}
              </span>
            </>
          )}
        </div>
        <p className={cn("font-medium", event.done && "line-through")}>
          {event.title}
        </p>
        {event.notes && (
          <p className="text-[var(--color-muted-foreground)]">{event.notes}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={busy !== null}
        aria-label="Deletar"
        className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--color-muted-foreground)] hover:text-rose-300"
      >
        {busy === "delete" ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Trash2 className="size-3" />
        )}
      </button>
    </li>
  );
}
