"use client";

import * as React from "react";
import { ArrowLeft, Loader2, Pin, PinOff, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/editor/rich-editor";
import { getNote } from "@/lib/queries";
import {
  deleteNote,
  renameNote,
  saveNoteContent,
  setNoteColor,
  setNotePinned,
} from "@/features/notes/actions";
import { NOTE_COLORS } from "./note-styles";

export function NoteEditor({
  id,
  onBack,
  onDeleted,
}: {
  id: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [pinned, setPinned] = React.useState(false);
  const [color, setColor] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<unknown>(null);

  React.useEffect(() => {
    let active = true;
    setLoaded(false);
    setMissing(false);
    void getNote(id).then((n) => {
      if (!active) return;
      if (!n) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      setTitle(n.title);
      setPinned(n.pinned);
      setColor(n.color);
      setContent(n.content ?? null);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const saveContent = React.useCallback((c: unknown) => saveNoteContent(id, c), [id]);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    void setNotePinned(id, next);
  }

  function pickColor(c: string | null) {
    setColor(c);
    void setNoteColor(id, c);
  }

  if (!loaded)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  if (missing)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">Nota não encontrada.</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Voltar
        </Button>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 items-center gap-1 border-b border-[var(--color-border)] px-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void renameNote(id, title)}
          maxLength={200}
          placeholder="Título da nota"
          className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm font-semibold outline-none focus:bg-[var(--color-card)]"
        />

        {/* paleta de cores */}
        <div className="flex items-center gap-1 px-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c ?? "none"}
              type="button"
              aria-label={c ? `Cor ${c}` : "Sem cor"}
              onClick={() => pickColor(c)}
              className={cn(
                "size-4 rounded-full border border-[var(--color-border)]",
                color === c && "ring-2 ring-offset-1 ring-offset-[var(--color-background)] ring-[var(--color-foreground)]"
              )}
              style={{ background: c ?? "transparent" }}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={pinned ? "Desafixar" : "Fixar no topo"}
          onClick={togglePin}
        >
          {pinned ? (
            <Pin className="size-4 text-[var(--color-primary)]" />
          ) : (
            <PinOff className="size-4 text-[var(--color-muted-foreground)]" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir nota"
          onClick={async () => {
            if (!confirm("Excluir esta nota? Vai pra Lixeira.")) return;
            await deleteNote(id);
            onDeleted();
          }}
        >
          <Trash2 className="size-4 text-[var(--color-muted-foreground)]" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <RichEditor
          initialContent={content}
          onSave={saveContent}
          placeholder="Escreva sua nota…"
          stickyTopClass="top-0"
        />
      </div>
    </div>
  );
}
