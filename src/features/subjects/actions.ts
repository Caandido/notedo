"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

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

  const userId = await getCurrentUserId();

  const subject = await prisma.subject.create({
    data: {
      userId,
      name,
      color: input.color,
      priority: (input.priority ?? "medium").toUpperCase() as
        | "LOW"
        | "MEDIUM"
        | "HIGH",
      tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
    },
  });

  revalidatePath("/subjects");
  revalidatePath("/timer");
  revalidatePath("/");

  return { ok: true as const, id: subject.id };
}

export async function archiveSubject(subjectId: string) {
  const userId = await getCurrentUserId();
  const updated = await prisma.subject.updateMany({
    where: { id: subjectId, userId },
    data: { archived: true },
  });
  if (updated.count === 0) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }
  revalidatePath("/subjects");
  revalidatePath("/timer");
  revalidatePath("/");
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

  const userId = await getCurrentUserId();
  const updated = await prisma.subject.updateMany({
    where: { id: input.id, userId },
    data: {
      name,
      color: input.color,
      priority: input.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
    },
  });
  if (updated.count === 0)
    return { ok: false as const, error: "Matéria não encontrada." };

  revalidatePath("/subjects");
  revalidatePath(`/subjects/${input.id}`);
  revalidatePath("/timer");
  revalidatePath("/");
  return { ok: true as const };
}

export async function unarchiveSubject(subjectId: string) {
  const userId = await getCurrentUserId();
  const updated = await prisma.subject.updateMany({
    where: { id: subjectId, userId },
    data: { archived: false },
  });
  if (updated.count === 0) {
    return { ok: false as const, error: "Matéria não encontrada." };
  }
  revalidatePath("/subjects");
  return { ok: true as const };
}
