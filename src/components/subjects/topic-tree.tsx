"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewTopicForm } from "@/components/subjects/new-topic-form";
import {
  deleteTopic,
  updateTopicNotes,
} from "@/features/topics/actions";
import { cn } from "@/lib/utils";
import type { TopicNode } from "@/lib/queries";

interface TopicTreeProps {
  subjectId: string;
  topics: TopicNode[];
}

export function TopicTree({ subjectId, topics }: TopicTreeProps) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Sem tópicos ainda. Crie o primeiro acima.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {topics.map((t) => (
        <TopicItem key={t.id} subjectId={subjectId} topic={t} depth={0} />
      ))}
    </ul>
  );
}

interface TopicItemProps {
  subjectId: string;
  topic: TopicNode;
  depth: number;
}

function TopicItem({ subjectId, topic, depth }: TopicItemProps) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [notes, setNotes] = React.useState(topic.notes ?? "");
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [notesError, setNotesError] = React.useState<string | null>(null);
  const initialNotes = topic.notes ?? "";

  const hasChildren = topic.children.length > 0;
  const hasNotes = (topic.notes ?? "").trim().length > 0;
  const dirty = notes !== initialNotes;

  async function onDelete() {
    if (
      !confirm(
        `Deletar "${topic.title}"${hasChildren ? " e seus subtópicos" : ""}?`
      )
    )
      return;
    setDeleting(true);
    const result = await deleteTopic(topic.id);
    setDeleting(false);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function saveNotes() {
    setSavingNotes(true);
    setNotesError(null);
    const result = await updateTopicNotes(topic.id, notes);
    setSavingNotes(false);
    if (result.ok) router.refresh();
    else setNotesError(result.error);
  }

  return (
    <li>
      <div
        className="group flex items-center gap-2 rounded-md py-1.5 pr-1 hover:bg-[var(--color-accent)]/40"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label={expanded ? "Recolher" : "Expandir"}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <Link
          href={`/topics/${topic.id}`}
          className="flex-1 truncate text-sm hover:underline underline-offset-2"
        >
          {topic.title}
        </Link>
        {hasNotes && !notesOpen && (
          <FileText className="size-3 shrink-0 text-[var(--color-muted-foreground)]" />
        )}
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 text-xs",
              notesOpen
                ? "text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            <FileText className="size-3" />
            notas
          </button>
          <NewTopicForm
            subjectId={subjectId}
            parentId={topic.id}
            variant="inline"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Deletar"
            className="size-7"
          >
            {deleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
          </Button>
        </div>
      </div>

      {notesOpen && (
        <div
          className="mt-1 space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3"
          style={{ marginLeft: `${depth * 20 + 24}px` }}
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anote o que importa sobre este tópico..."
            rows={4}
            maxLength={4000}
            className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              {notes.length} / 4000
            </span>
            <div className="flex items-center gap-2">
              {notesError && (
                <span className="text-rose-300">{notesError}</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotes(initialNotes);
                  setNotesOpen(false);
                  setNotesError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes || !dirty}
                className="gap-1.5"
              >
                {savingNotes ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {hasChildren && expanded && (
        <ul className="space-y-1">
          {topic.children.map((c) => (
            <TopicItem
              key={c.id}
              subjectId={subjectId}
              topic={c}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
