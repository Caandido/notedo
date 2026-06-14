"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

export type SaveSessionInput = {
  subjectId: string | null;
  /** Multi-matéria: todas as matérias da sessão. Se vazio, usa [subjectId]. */
  subjectIds?: string[];
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
  // Normaliza a lista de matérias (multi-matéria), validando a posse.
  const ids = Array.from(
    new Set(
      (input.subjectIds && input.subjectIds.length
        ? input.subjectIds
        : input.subjectId
          ? [input.subjectId]
          : []
      ).filter(Boolean)
    )
  );
  for (const sid of ids) {
    const subject = await db().subjects.get(sid);
    if (!subject || subject.userId !== userId)
      return { ok: false as const, error: "Matéria não encontrada." };
  }

  const startedAtMs = input.startedAt
    ? new Date(input.startedAt).getTime()
    : Date.now();
  await writeAdd("sessions", {
    id: cuid(),
    userId,
    subjectId: ids[0] ?? null,
    subjectIds: ids.length ? ids : null,
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
