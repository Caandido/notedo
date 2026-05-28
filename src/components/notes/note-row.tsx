"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Pin, PinOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteNote, togglePinNote } from "@/features/notes/actions";

interface NoteRowProps {
  note: {
    id: string;
    title: string;
    pinned: boolean;
    updatedAt: Date;
  };
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
}

export function NoteRow({ note }: NoteRowProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"pin" | "delete" | null>(null);

  async function onPin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy("pin");
    const result = await togglePinNote(note.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Deletar "${note.title}"?`)) return;
    setBusy("delete");
    const result = await deleteNote(note.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <Link href={`/notes/${note.id}`} className="block">
      <Card className="group transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <FileText className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{note.title}</p>
              {note.pinned && (
                <Pin className="size-3 shrink-0 text-amber-300 rotate-45" />
              )}
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              atualizado {relativeTime(new Date(note.updatedAt))}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPin}
              disabled={busy !== null}
              aria-label={note.pinned ? "Desafixar" : "Fixar"}
              className="size-7"
            >
              {busy === "pin" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : note.pinned ? (
                <PinOff className="size-3" />
              ) : (
                <Pin className="size-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={busy !== null}
              aria-label="Deletar"
              className="size-7"
            >
              {busy === "delete" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
