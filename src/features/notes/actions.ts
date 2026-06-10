"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import type { NoteRow } from "@/lib/db/schema";

async function ownedNote(id: string): Promise<NoteRow | null> {
  const userId = getCurrentUserId();
  const n = await db().notes.get(id);
  return n && n.userId === userId ? n : null;
}

export async function createNote() {
  const userId = getCurrentUserId();
  const now = Date.now();
  const id = cuid();
  const row: NoteRow = {
    id,
    userId,
    title: "",
    content: null,
    pinned: false,
    color: null,
    createdAt: now,
    updatedAt: now,
    _dirty: 1,
  };
  await writeAdd("notes", row);
  invalidateAll();
  return { ok: true as const, id };
}

export async function renameNote(id: string, title: string) {
  if (!(await ownedNote(id)))
    return { ok: false as const, error: "Nota não encontrada." };
  await writeUpdate("notes", id, { title: title.slice(0, 200) });
  invalidateAll();
  return { ok: true as const };
}

export async function setNotePinned(id: string, pinned: boolean) {
  if (!(await ownedNote(id)))
    return { ok: false as const, error: "Nota não encontrada." };
  await writeUpdate("notes", id, { pinned });
  invalidateAll();
  return { ok: true as const };
}

export async function setNoteColor(id: string, color: string | null) {
  if (!(await ownedNote(id)))
    return { ok: false as const, error: "Nota não encontrada." };
  await writeUpdate("notes", id, { color });
  invalidateAll();
  return { ok: true as const };
}

/** Salva o corpo em texto rico (callback do RichEditor). Sem invalidateAll
 * pra não remontar o editor durante a digitação. */
export async function saveNoteContent(id: string, content: unknown) {
  if (!(await ownedNote(id)))
    return { ok: false as const, error: "Nota não encontrada." };
  await writeUpdate("notes", id, { content });
  return { ok: true as const };
}

export async function deleteNote(id: string) {
  if (!(await ownedNote(id)))
    return { ok: false as const, error: "Nota não encontrada." };
  await writeDelete("notes", id);
  invalidateAll();
  return { ok: true as const };
}
