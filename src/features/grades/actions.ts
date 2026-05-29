"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import { dateInputToMs } from "@/lib/utils";

export type GradeType = "exam" | "assignment" | "quiz" | "other";

const VALID_TYPES: GradeType[] = ["exam", "assignment", "quiz", "other"];

export type CreateGradeInput = {
  subjectId: string;
  title: string;
  type: GradeType;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  comments?: string;
};

function validate(input: Omit<CreateGradeInput, "subjectId">) {
  if (!input.title.trim()) return "Título obrigatório.";
  if (!VALID_TYPES.includes(input.type)) return "Tipo inválido.";
  if (!Number.isFinite(input.score) || input.score < 0)
    return "Nota inválida.";
  if (!Number.isFinite(input.maxScore) || input.maxScore <= 0)
    return "Máxima inválida.";
  if (input.score > input.maxScore * 1.5)
    return "Nota acima do limite.";
  if (!Number.isFinite(input.weight) || input.weight <= 0)
    return "Peso inválido.";
  if (Number.isNaN(dateInputToMs(input.date))) return "Data inválida.";
  return null;
}

export async function createGrade(input: CreateGradeInput) {
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const userId = getCurrentUserId();
  const subject = await db().subjects.get(input.subjectId);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };

  const now = Date.now();
  await writeAdd("grades", {
    id: cuid(),
    userId,
    subjectId: input.subjectId,
    title: input.title.trim(),
    type: input.type.toUpperCase() as "EXAM" | "ASSIGNMENT" | "QUIZ" | "OTHER",
    score: input.score,
    maxScore: input.maxScore,
    weight: input.weight,
    date: dateInputToMs(input.date),
    comments: input.comments?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateGradeInput = CreateGradeInput & { id: string };

export async function updateGrade(input: UpdateGradeInput) {
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const userId = getCurrentUserId();
  const subject = await db().subjects.get(input.subjectId);
  if (!subject || subject.userId !== userId)
    return { ok: false as const, error: "Matéria não encontrada." };

  const grade = await db().grades.get(input.id);
  if (!grade || grade.userId !== userId)
    return { ok: false as const, error: "Nota não encontrada." };

  await writeUpdate("grades", input.id, {
    subjectId: input.subjectId,
    title: input.title.trim(),
    type: input.type.toUpperCase() as "EXAM" | "ASSIGNMENT" | "QUIZ" | "OTHER",
    score: input.score,
    maxScore: input.maxScore,
    weight: input.weight,
    date: dateInputToMs(input.date),
    comments: input.comments?.trim() || null,
  });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteGrade(id: string) {
  const userId = getCurrentUserId();
  const grade = await db().grades.get(id);
  if (!grade || grade.userId !== userId)
    return { ok: false as const, error: "Nota não encontrada." };
  await writeDelete("grades", id);
  invalidateAll();
  return { ok: true as const };
}
