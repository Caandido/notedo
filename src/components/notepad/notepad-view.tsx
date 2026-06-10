"use client";

import * as React from "react";
import { NotebookPen, Pin, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getNotesForUser } from "@/lib/queries";
import type { NoteListItem } from "@/lib/queries";
import { createNote } from "@/features/notes/actions";
import { NoteEditor } from "./note-editor";

function formatWhen(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (sameDay)
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotepadView({ initialNoteId }: { initialNoteId?: string }) {
  const { data: notes, loading } = useRepoQuery(() => getNotesForUser(), []);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialNoteId ?? null
  );

  // Se a nota selecionada sumiu (excluída/sync), limpa a seleção.
  const selected =
    selectedId && notes?.some((n) => n.id === selectedId) ? selectedId : null;

  async function onCreate() {
    const res = await createNote();
    if (res.ok) setSelectedId(res.id);
  }

  if (loading && !notes) {
    return (
      <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Carregando…
      </p>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-0 md:h-[calc(100dvh-3.5rem)]">
      {/* Lista (mestre) */}
      <aside
        className={cn(
          "min-h-0 w-full flex-col border-r border-[var(--color-border)] md:flex md:w-80",
          selected ? "hidden md:flex" : "flex"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {notes?.length ?? 0} nota{(notes?.length ?? 0) === 1 ? "" : "s"}
          </span>
          <Button size="sm" onClick={onCreate} className="h-7 gap-1.5">
            <Plus className="size-3.5" />
            Nova nota
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {!notes || notes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <NotebookPen className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <p className="text-sm font-medium">Nenhuma nota ainda</p>
              <p className="max-w-xs text-xs text-[var(--color-muted-foreground)]">
                Anotações soltas em texto rico (listas, code blocks, links). Crie
                quantas quiser — ficam separadas aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  active={n.id === selected}
                  onClick={() => setSelectedId(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Editor (detalhe) */}
      <section
        className={cn(
          "min-h-0 flex-1",
          selected ? "block" : "hidden md:block"
        )}
      >
        {selected ? (
          <NoteEditor
            key={selected}
            id={selected}
            onBack={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center gap-3 text-center md:flex">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <NotebookPen className="size-6 text-[var(--color-muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Selecione uma nota ou crie uma nova.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function NoteCard({
  note,
  active,
  onClick,
}: {
  note: NoteListItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-2 rounded-lg border p-2.5 text-left transition-colors",
        active
          ? "border-[var(--color-ring)] bg-[var(--color-accent)]"
          : "border-[var(--color-border)] hover:bg-[var(--color-accent)]/50"
      )}
    >
      <span
        className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
        style={{ background: note.color ?? "transparent" }}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {note.pinned && <Pin className="size-3 shrink-0 text-[var(--color-primary)]" />}
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {note.title || "Sem título"}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--color-muted-foreground)]">
            {formatWhen(note.updatedAt)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--color-muted-foreground)]">
          {note.preview || "Vazia"}
        </span>
      </span>
    </button>
  );
}
