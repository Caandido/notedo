"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export type SaveSessionInput = {
  subjectId: string | null;
  mode: "pomodoro" | "free" | "reverse" | "custom";
  durationSeconds: number;
  startedAt?: string;
  focusScore?: number;
};

function validate(input: SaveSessionInput): string | null {
  if (!["pomodoro", "free", "reverse", "custom"].includes(input.mode)) {
    return "Modo inválido.";
  }
  if (
    !Number.isInteger(input.durationSeconds) ||
    input.durationSeconds < 1 ||
    input.durationSeconds > 24 * 3600
  ) {
    return "Duração inválida.";
  }
  if (input.subjectId !== null && typeof input.subjectId !== "string") {
    return "Matéria inválida.";
  }
  if (
    input.focusScore !== undefined &&
    (input.focusScore < 0 || input.focusScore > 100)
  ) {
    return "Foco inválido.";
  }
  return null;
}

export async function saveStudySession(input: SaveSessionInput) {
  const error = validate(input);
  if (error) return { ok: false as const, error };

  const userId = await getCurrentUserId();
  const startedAt = input.startedAt ? new Date(input.startedAt) : new Date();
  const endedAt = new Date(startedAt.getTime() + input.durationSeconds * 1000);

  if (input.subjectId) {
    const owned = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
      select: { id: true },
    });
    if (!owned) {
      return { ok: false as const, error: "Matéria não encontrada." };
    }
  }

  await prisma.studySession.create({
    data: {
      userId,
      subjectId: input.subjectId ?? undefined,
      mode: input.mode.toUpperCase() as
        | "POMODORO"
        | "FREE"
        | "REVERSE"
        | "CUSTOM",
      startedAt,
      endedAt,
      durationSeconds: input.durationSeconds,
      focusScore: input.focusScore,
    },
  });

  revalidatePath("/");
  revalidatePath("/timer");

  return { ok: true as const };
}
