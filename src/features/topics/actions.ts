"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export type CreateTopicInput = {
  subjectId: string;
  title: string;
  parentId?: string | null;
};

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

export async function createTopic(input: CreateTopicInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = await getCurrentUserId();

  if (!(await assertSubjectOwnership(input.subjectId, userId))) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }

  if (input.parentId) {
    const parent = await prisma.topic.findFirst({
      where: { id: input.parentId, subjectId: input.subjectId },
      select: { id: true },
    });
    if (!parent)
      return { ok: false as const, error: "Tópico pai não encontrado." };
  }

  const order = await prisma.topic.count({
    where: { subjectId: input.subjectId, parentId: input.parentId ?? null },
  });

  await prisma.topic.create({
    data: {
      subjectId: input.subjectId,
      parentId: input.parentId ?? null,
      title,
      order,
    },
  });

  revalidatePath(`/subjects/${input.subjectId}`);
  revalidatePath("/subjects");
  return { ok: true as const };
}

export async function renameTopic(topicId: string, title: string) {
  const next = title.trim();
  if (!next) return { ok: false as const, error: "Título obrigatório." };
  if (next.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = await getCurrentUserId();

  const topic = await prisma.topic.findFirst({
    where: { id: topicId, subject: { userId } },
    select: { id: true, subjectId: true },
  });
  if (!topic) return { ok: false as const, error: "Tópico não encontrado." };

  await prisma.topic.update({
    where: { id: topic.id },
    data: { title: next },
  });

  revalidatePath(`/subjects/${topic.subjectId}`);
  return { ok: true as const };
}

export async function deleteTopic(topicId: string) {
  const userId = await getCurrentUserId();
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, subject: { userId } },
    select: { id: true, subjectId: true },
  });
  if (!topic) return { ok: false as const, error: "Tópico não encontrado." };

  await prisma.topic.delete({ where: { id: topic.id } });

  revalidatePath(`/subjects/${topic.subjectId}`);
  revalidatePath("/subjects");
  return { ok: true as const };
}
