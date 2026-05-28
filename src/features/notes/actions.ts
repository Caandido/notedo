"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export async function createNote(input: { title: string }) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = await getCurrentUserId();
  const note = await prisma.note.create({
    data: { userId, title, content: EMPTY_DOC },
  });

  revalidatePath("/notes");
  return { ok: true as const, id: note.id };
}

export async function updateNote(input: {
  id: string;
  title?: string;
  content?: unknown;
}) {
  const userId = await getCurrentUserId();
  const note = await prisma.note.findFirst({
    where: { id: input.id, userId },
    select: { id: true },
  });
  if (!note) return { ok: false as const, error: "Nota não encontrada." };

  const data: { title?: string; content?: unknown } = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (!t) return { ok: false as const, error: "Título obrigatório." };
    if (t.length > 120)
      return { ok: false as const, error: "Título muito longo." };
    data.title = t;
  }
  if (input.content !== undefined) {
    if (JSON.stringify(input.content).length > 500_000)
      return {
        ok: false as const,
        error: "Conteúdo muito grande (máx. 500KB).",
      };
    data.content = input.content;
  }

  await prisma.note.update({
    where: { id: note.id },
    data: data as {
      title?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content?: any;
    },
  });

  revalidatePath("/notes");
  revalidatePath(`/notes/${note.id}`);
  return { ok: true as const };
}

export async function togglePinNote(id: string) {
  const userId = await getCurrentUserId();
  const note = await prisma.note.findFirst({
    where: { id, userId },
    select: { id: true, pinned: true },
  });
  if (!note) return { ok: false as const, error: "Nota não encontrada." };
  await prisma.note.update({
    where: { id: note.id },
    data: { pinned: !note.pinned },
  });
  revalidatePath("/notes");
  return { ok: true as const };
}

export async function deleteNote(id: string) {
  const userId = await getCurrentUserId();
  const deleted = await prisma.note.deleteMany({ where: { id, userId } });
  if (deleted.count === 0)
    return { ok: false as const, error: "Nota não encontrada." };
  revalidatePath("/notes");
  return { ok: true as const };
}
