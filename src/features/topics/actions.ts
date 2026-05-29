"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeBulkDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

async function assertSubjectOwnership(subjectId: string, userId: string) {
  const subject = await db().subjects.get(subjectId);
  return subject?.userId === userId;
}

export type CreateTopicInput = {
  subjectId: string;
  title: string;
  parentId?: string | null;
};

export async function createTopic(input: CreateTopicInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = getCurrentUserId();
  if (!(await assertSubjectOwnership(input.subjectId, userId)))
    return { ok: false as const, error: "Matéria não encontrada." };

  if (input.parentId) {
    const parent = await db().topics.get(input.parentId);
    if (!parent || parent.subjectId !== input.subjectId)
      return { ok: false as const, error: "Tópico pai não encontrado." };
  }

  const siblingCount = await db()
    .topics.where({ subjectId: input.subjectId, parentId: input.parentId ?? null })
    .count();

  const now = Date.now();
  const id = cuid();
  await writeAdd("topics", {
    id,
    userId,
    subjectId: input.subjectId,
    parentId: input.parentId ?? null,
    title,
    content: EMPTY_DOC,
    order: siblingCount,
    createdAt: now,
    updatedAt: now,
  });

  invalidateAll();
  return { ok: true as const, id };
}

export async function renameTopic(topicId: string, title: string) {
  const next = title.trim();
  if (!next) return { ok: false as const, error: "Título obrigatório." };
  if (next.length > 120)
    return { ok: false as const, error: "Título muito longo." };

  const userId = getCurrentUserId();
  const topic = await db().topics.get(topicId);
  if (!topic) return { ok: false as const, error: "Tópico não encontrado." };
  if (!(await assertSubjectOwnership(topic.subjectId, userId)))
    return { ok: false as const, error: "Tópico não encontrado." };

  await writeUpdate("topics", topicId, { title: next });
  invalidateAll();
  return { ok: true as const };
}

export async function updateTopicContent(topicId: string, content: unknown) {
  const userId = getCurrentUserId();
  const topic = await db().topics.get(topicId);
  if (!topic) return { ok: false as const, error: "Tópico não encontrado." };
  if (!(await assertSubjectOwnership(topic.subjectId, userId)))
    return { ok: false as const, error: "Tópico não encontrado." };

  await writeUpdate("topics", topicId, { content });
  invalidateAll();
  return { ok: true as const };
}

async function descendants(topicId: string): Promise<string[]> {
  const direct = await db().topics.where("parentId").equals(topicId).toArray();
  const out: string[] = [];
  for (const c of direct) {
    out.push(c.id);
    out.push(...(await descendants(c.id)));
  }
  return out;
}

export async function deleteTopic(topicId: string) {
  const userId = getCurrentUserId();
  const topic = await db().topics.get(topicId);
  if (!topic) return { ok: false as const, error: "Tópico não encontrado." };
  if (!(await assertSubjectOwnership(topic.subjectId, userId)))
    return { ok: false as const, error: "Tópico não encontrado." };

  const ids = [topicId, ...(await descendants(topicId))];
  await writeBulkDelete("topics", ids);
  invalidateAll();
  return { ok: true as const };
}
