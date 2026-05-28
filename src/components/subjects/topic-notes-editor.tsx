"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateTopicNotes } from "@/features/topics/actions";

interface TopicNotesEditorProps {
  topicId: string;
  initialNotes: string | null;
}

export function TopicNotesEditor({
  topicId,
  initialNotes,
}: TopicNotesEditorProps) {
  const router = useRouter();
  const initial = initialNotes ?? "";
  const [notes, setNotes] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const dirty = notes !== initial;

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await updateTopicNotes(topicId, notes);
    setSaving(false);
    if (result.ok) {
      setSavedAt(Date.now());
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[var(--color-muted-foreground)]" />
          <h3 className="text-sm font-semibold">Notas</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {savedAt && !dirty && (
            <span className="text-emerald-300">Salvo</span>
          )}
          {error && <span className="text-rose-300">{error}</span>}
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || !dirty}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Salvar
          </Button>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anote o que importa sobre este tópico. Definições, exemplos, dúvidas..."
        rows={10}
        maxLength={4000}
        className="w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-ring)]"
      />
      <p className="text-right text-xs text-[var(--color-muted-foreground)]">
        {notes.length} / 4000
      </p>
    </div>
  );
}
