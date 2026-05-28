"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { renameTopic } from "@/features/topics/actions";

interface EditTopicTitleProps {
  topicId: string;
  initialTitle: string;
}

export function EditTopicTitle({ topicId, initialTitle }: EditTopicTitleProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(initialTitle);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSave() {
    if (!title.trim()) return setError("Título obrigatório.");
    if (title.trim() === initialTitle) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await renameTopic(topicId, title);
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function cancel() {
    setEditing(false);
    setTitle(initialTitle);
    setError(null);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{initialTitle}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditing(true)}
          aria-label="Editar título"
          className="size-7"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") cancel();
          }}
          className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base font-semibold outline-none transition-colors focus:border-[var(--color-ring)]"
        />
        <Button
          size="icon"
          onClick={onSave}
          disabled={saving}
          aria-label="Salvar"
          className="size-8"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={cancel}
          aria-label="Cancelar"
          className="size-8"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
