import { StickyNote } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { NewNoteForm } from "@/components/notes/new-note-form";
import { NoteRow } from "@/components/notes/note-row";
import { getNotesForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotesForUser();
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <>
      <Header
        title="Notas"
        subtitle={`${notes.length} nota${notes.length === 1 ? "" : "s"} · ${pinned.length} fixada${pinned.length === 1 ? "" : "s"}`}
      />
      <div className="space-y-4 p-6">
        <NewNoteForm />

        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                <StickyNote className="size-5 text-[var(--color-muted-foreground)]" />
              </div>
              <h2 className="text-lg font-semibold">Nenhuma nota ainda</h2>
              <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
                Notas avulsas pra ideias, snippets, listas — fora das matérias.
                Crie sua primeira acima.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pinned.length > 0 && (
              <>
                <p className="text-xs font-medium text-amber-300">Fixadas</p>
                {pinned.map((n) => (
                  <NoteRow key={n.id} note={n} />
                ))}
                {rest.length > 0 && (
                  <p className="pt-3 text-xs font-medium text-[var(--color-muted-foreground)]">
                    Outras
                  </p>
                )}
              </>
            )}
            {rest.map((n) => (
              <NoteRow key={n.id} note={n} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
