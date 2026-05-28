import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { NoteEditorWrapper } from "@/components/notes/note-editor-wrapper";
import { getNoteById } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) notFound();

  const updatedAt = new Date(note.updatedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Header title={note.title} subtitle={`atualizado ${updatedAt}`} />
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 h-7">
            <Link href="/notes">
              <ArrowLeft className="size-3.5" />
              Notas
            </Link>
          </Button>
          <ChevronRight className="size-3" />
          <span className="text-[var(--color-foreground)]">{note.title}</span>
        </div>

        <NoteEditorWrapper
          noteId={note.id}
          initialTitle={note.title}
          initialContent={note.content}
        />
      </div>
    </>
  );
}
