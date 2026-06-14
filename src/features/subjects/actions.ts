"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export type CreateSubjectInput = {
  name: string;
  color: string;
  icon?: string | null;
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
  await writeAdd("subjects", {
    id,
    userId,
    name,
    color: input.color,
    icon: input.icon ?? null,
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
  await writeUpdate("subjects", subjectId, { archived: true });
  invalidateAll();
  return { ok: true as const };
}

export async function unarchiveSubject(subjectId: string) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(subjectId);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };
  await writeUpdate("subjects", subjectId, { archived: false });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateSubjectInput = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
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

  await writeUpdate("subjects", input.id, {
    name,
    color: input.color,
    icon: input.icon ?? null,
    priority: input.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
  });
  invalidateAll();
  return { ok: true as const };
}

/**
 * Define (ou limpa) a meta de PONTOS da matéria para um semestre específico.
 * Guarda em `gradeGoals` ({ [semestre]: pontos }). Passe `target = null` pra
 * remover a meta daquele semestre.
 */
export async function setSubjectSemesterGoal(input: {
  id: string;
  semester: string;
  target: number | null;
}) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(input.id);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };
  if (!input.semester || input.semester === "ALL")
    return { ok: false as const, error: "Escolha um semestre específico." };
  if (
    input.target !== null &&
    (!Number.isFinite(input.target) || input.target <= 0)
  )
    return { ok: false as const, error: "Meta de pontos inválida." };

  const goals: Record<string, number> = { ...(subject.gradeGoals ?? {}) };
  if (input.target === null) delete goals[input.semester];
  else goals[input.semester] = input.target;

  await writeUpdate("subjects", input.id, { gradeGoals: goals });
  invalidateAll();
  return { ok: true as const };
}
