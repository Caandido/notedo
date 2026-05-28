"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

export type SaveSessionInput = {
  subjectId: string | null;
  mode: "pomodoro" | "free" | "reverse" | "custom";
  durationSeconds: number;
  startedAt?: string;
  focusScore?: number;
};

export async function saveStudySession(input: SaveSessionInput) {
  if (!["pomodoro", "free", "reverse", "custom"].includes(input.mode))
    return { ok: false as const, error: "Modo inválido." };
  if (
    !Number.isInteger(input.durationSeconds) ||
    input.durationSeconds < 1 ||
    input.durationSeconds > 24 * 3600
  )
    return { ok: false as const, error: "Duração inválida." };

  const userId = getCurrentUserId();
  if (input.subjectId) {
    const subject = await db().subjects.get(input.subjectId);
    if (!subject || subject.userId !== userId)
      return { ok: false as const, error: "Matéria não encontrada." };
  }

  const startedAtMs = input.startedAt
    ? new Date(input.startedAt).getTime()
    : Date.now();
  await db().sessions.add({
    id: cuid(),
    userId,
    subjectId: input.subjectId,
    topicId: null,
    mode: input.mode.toUpperCase() as
      | "POMODORO"
      | "FREE"
      | "REVERSE"
      | "CUSTOM",
    startedAt: startedAtMs,
    endedAt: startedAtMs + input.durationSeconds * 1000,
    durationSeconds: input.durationSeconds,
    focusScore: input.focusScore ?? null,
    createdAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}
