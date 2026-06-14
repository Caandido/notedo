"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import { dateInputToMs } from "@/lib/utils";

export type EventType = "exam" | "task" | "class" | "custom";

const VALID_TYPES: EventType[] = ["exam", "task", "class", "custom"];

export type CreateEventInput = {
  title: string;
  type: EventType;
  date: string;
  subjectId?: string | null;
  /** Multi-matéria: o evento pode pertencer a várias matérias. */
  subjectIds?: string[];
  notes?: string;
};

/** Normaliza e valida a lista de matérias (multi-matéria). */
async function resolveSubjectIds(
  input: { subjectId?: string | null; subjectIds?: string[] },
  userId: string
): Promise<{ ids: string[] } | { error: string }> {
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
    if (!subject || subject.userId !== userId) return { error: "Matéria não encontrada." };
  }
  return { ids };
}

export async function createEvent(input: CreateEventInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (!VALID_TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };
  const ts = dateInputToMs(input.date);
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  const r = await resolveSubjectIds(input, userId);
  if ("error" in r) return { ok: false as const, error: r.error };

  const now = Date.now();
  await writeAdd("events", {
    id: cuid(),
    userId,
    subjectId: r.ids[0] ?? null,
    subjectIds: r.ids.length ? r.ids : null,
    type: input.type.toUpperCase() as "EXAM" | "TASK" | "CLASS" | "CUSTOM",
    title,
    notes: input.notes?.trim() || null,
    date: ts,
    done: false,
    createdAt: now,
    updatedAt: now,
  });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateEventInput = CreateEventInput & { id: string };

export async function updateEvent(input: UpdateEventInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  const ts = dateInputToMs(input.date);
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  const event = await db().events.get(input.id);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };

  const r = await resolveSubjectIds(input, userId);
  if ("error" in r) return { ok: false as const, error: r.error };

  await writeUpdate("events", input.id, {
    title,
    type: input.type.toUpperCase() as "EXAM" | "TASK" | "CLASS" | "CUSTOM",
    date: ts,
    subjectId: r.ids[0] ?? null,
    subjectIds: r.ids.length ? r.ids : null,
    notes: input.notes?.trim() || null,
  });
  invalidateAll();
  return { ok: true as const };
}

export async function toggleEventDone(eventId: string) {
  const userId = getCurrentUserId();
  const event = await db().events.get(eventId);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };
  await writeUpdate("events", eventId, { done: !event.done });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteEvent(eventId: string) {
  const userId = getCurrentUserId();
  const event = await db().events.get(eventId);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };
  await writeDelete("events", eventId);
  invalidateAll();
  return { ok: true as const };
}
