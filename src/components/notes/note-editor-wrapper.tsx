"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/editor/rich-editor";
import { updateNote } from "@/features/notes/actions";

interface NoteEditorWrapperProps {
  noteId: string;
  initialTitle: string;
  initialContent: unknown;
}

export function NoteEditorWrapper({
  noteId,
  initialTitle,
  initialContent,
}: NoteEditorWrapperProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [savingTitle, setSavingTitle] = React.useState(false);
  const [titleError, setTitleError] = React.useState<string | null>(null);

  async function saveTitle() {
    if (!title.trim()) return setTitleError("Título obrigatório.");
    if (title.trim() === initialTitle) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    setTitleError(null);
    const result = await updateNote({ id: noteId, title });
    setSavingTitle(false);
    if (result.ok) {
      setEditingTitle(false);
      router.refresh();
    } else {
      setTitleError(result.error);
    }
  }

  const saveContent = React.useCallback(
    async (content: unknown) => {
      const result = await updateNote({ id: noteId, content });
      return result;
    },
    [noteId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        {editingTitle ? (
          <div className="flex-1 space-y-1">
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setEditingTitle(false);
                  setTitle(initialTitle);
                  setTitleError(null);
                }
              }}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-2xl font-semibold outline-none transition-colors focus:border-[var(--color-ring)]"
            />
            {titleError && <p className="text-xs text-rose-300">{titleError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveTitle}
                disabled={savingTitle}
                className="gap-1.5"
              >
                {savingTitle ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingTitle(false);
                  setTitle(initialTitle);
                  setTitleError(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTitle(true)}
              aria-label="Editar título"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <RichEditor initialContent={initialContent} onSave={saveContent} />
    </div>
  );
}
