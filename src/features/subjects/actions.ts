"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export type CreateSubjectInput = {
  name: string;
  color: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
};

export async function createSubject(input: CreateSubjectInput) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Nome obrigatório." };
  if (name.length > 80) return { ok: false as const, error: "Nome muito longo." };
  if (!COLOR_RE.test(input.color))
    return { ok: false as const, error: "Cor inválida." };

  const userId = getCurrentUserId();
  const now = Date.now();
  const id = cuid();
  await db().subjects.add({
    id,
    userId,
    name,
    color: input.color,
    icon: null,
    priority: (input.priority ?? "medium").toUpperCase() as
      | "LOW"
      | "MEDIUM"
      | "HIGH",
    progress: 0,
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
    archived: false,
    createdAt: now,
    updatedAt: now,
  });

  invalidateAll();
  return { ok: true as const, id };
}

export async function archiveSubject(subjectId: string) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(subjectId);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };
  await db().subjects.update(subjectId, {
    archived: true,
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function unarchiveSubject(subjectId: string) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(subjectId);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };
  await db().subjects.update(subjectId, {
    archived: false,
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateSubjectInput = {
  id: string;
  name: string;
  color: string;
  priority: "low" | "medium" | "high";
  tags?: string[];
};

export async function updateSubject(input: UpdateSubjectInput) {
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Nome obrigatório." };
  if (name.length > 80)
    return { ok: false as const, error: "Nome muito longo." };
  if (!COLOR_RE.test(input.color))
    return { ok: false as const, error: "Cor inválida." };

  const userId = getCurrentUserId();
  const subject = await db().subjects.get(input.id);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };

  await db().subjects.update(input.id, {
    name,
    color: input.color,
    priority: input.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}
