"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

async function assertSubjectOwnership(
  subjectId: string,
  userId: string
): Promise<boolean> {
  const owned = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
    select: { id: true },
  });
  return owned !== null;
}

export async function createSummary(input: {
  subjectId: string;
  title: string;
}) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = await getCurrentUserId();
  if (!(await assertSubjectOwnership(input.subjectId, userId))) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }

  const summary = await prisma.summary.create({
    data: {
      subjectId: input.subjectId,
      title,
      content: EMPTY_DOC,
    },
  });

  revalidatePath(`/subjects/${input.subjectId}`);
  return { ok: true as const, id: summary.id };
}

export async function updateSummary(input: {
  id: string;
  title?: string;
  content?: unknown;
}) {
  const userId = await getCurrentUserId();
  const summary = await prisma.summary.findFirst({
    where: { id: input.id, subject: { userId } },
    select: { id: true, subjectId: true },
  });
  if (!summary) return { ok: false as const, error: "Resumo não encontrado." };

  const data: { title?: string; content?: unknown } = {};
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (!t) return { ok: false as const, error: "Título obrigatório." };
    if (t.length > 120)
      return { ok: false as const, error: "Título muito longo." };
    data.title = t;
  }
  if (input.content !== undefined) {
    const serialized = JSON.stringify(input.content);
    if (serialized.length > 200_000)
      return { ok: false as const, error: "Conteúdo muito grande (máx. 200KB)." };
    data.content = input.content;
  }

  await prisma.summary.update({
    where: { id: summary.id },
    data: data as {
      title?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content?: any;
    },
  });

  revalidatePath(`/subjects/${summary.subjectId}`);
  revalidatePath(`/subjects/${summary.subjectId}/summary/${summary.id}`);
  return { ok: true as const };
}

export async function deleteSummary(id: string) {
  const userId = await getCurrentUserId();
  const summary = await prisma.summary.findFirst({
    where: { id, subject: { userId } },
    select: { id: true, subjectId: true },
  });
  if (!summary) return { ok: false as const, error: "Resumo não encontrado." };

  await prisma.summary.delete({ where: { id: summary.id } });

  revalidatePath(`/subjects/${summary.subjectId}`);
  return { ok: true as const, subjectId: summary.subjectId };
}
