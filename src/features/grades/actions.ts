"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

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
  const title = input.title.trim();
  if (!title) return "Título obrigatório.";
  if (title.length > 120) return "Título muito longo.";
  if (!VALID_TYPES.includes(input.type)) return "Tipo inválido.";
  if (!Number.isFinite(input.score) || input.score < 0)
    return "Nota inválida.";
  if (!Number.isFinite(input.maxScore) || input.maxScore <= 0)
    return "Máxima inválida.";
  if (input.score > input.maxScore * 1.5)
    return "Nota acima do limite (50% acima da máxima).";
  if (!Number.isFinite(input.weight) || input.weight <= 0 || input.weight > 100)
    return "Peso inválido (1-100).";
  if (Number.isNaN(new Date(input.date).getTime())) return "Data inválida.";
  return null;
}

async function assertSubjectOwnership(subjectId: string, userId: string) {
  const owned = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
    select: { id: true },
  });
  return owned !== null;
}

export async function createGrade(input: CreateGradeInput) {
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const userId = await getCurrentUserId();
  if (!(await assertSubjectOwnership(input.subjectId, userId))) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }

  await prisma.grade.create({
    data: {
      userId,
      subjectId: input.subjectId,
      title: input.title.trim(),
      type: input.type.toUpperCase() as
        | "EXAM"
        | "ASSIGNMENT"
        | "QUIZ"
        | "OTHER",
      score: input.score,
      maxScore: input.maxScore,
      weight: input.weight,
      date: new Date(input.date),
      comments: input.comments?.trim() || undefined,
    },
  });

  revalidatePath("/notes");
  revalidatePath("/stats");
  revalidatePath(`/subjects/${input.subjectId}`);
  return { ok: true as const };
}

export type UpdateGradeInput = CreateGradeInput & { id: string };

export async function updateGrade(input: UpdateGradeInput) {
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const userId = await getCurrentUserId();
  if (!(await assertSubjectOwnership(input.subjectId, userId))) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }

  const updated = await prisma.grade.updateMany({
    where: { id: input.id, userId },
    data: {
      subjectId: input.subjectId,
      title: input.title.trim(),
      type: input.type.toUpperCase() as
        | "EXAM"
        | "ASSIGNMENT"
        | "QUIZ"
        | "OTHER",
      score: input.score,
      maxScore: input.maxScore,
      weight: input.weight,
      date: new Date(input.date),
      comments: input.comments?.trim() || null,
    },
  });
  if (updated.count === 0)
    return { ok: false as const, error: "Nota não encontrada." };

  revalidatePath("/notes");
  revalidatePath("/stats");
  revalidatePath(`/subjects/${input.subjectId}`);
  return { ok: true as const };
}

export async function deleteGrade(id: string) {
  const userId = await getCurrentUserId();
  const grade = await prisma.grade.findFirst({
    where: { id, userId },
    select: { id: true, subjectId: true },
  });
  if (!grade) return { ok: false as const, error: "Nota não encontrada." };
  await prisma.grade.delete({ where: { id: grade.id } });

  revalidatePath("/notes");
  revalidatePath("/stats");
  revalidatePath(`/subjects/${grade.subjectId}`);
  return { ok: true as const };
}
