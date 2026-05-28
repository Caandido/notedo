"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

export type EventType = "exam" | "task" | "class" | "custom";

const VALID_TYPES: EventType[] = ["exam", "task", "class", "custom"];

export type CreateEventInput = {
  title: string;
  type: EventType;
  date: string;
  subjectId?: string | null;
  notes?: string;
};

export async function createEvent(input: CreateEventInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (!VALID_TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };
  const ts = new Date(input.date).getTime();
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  if (input.subjectId) {
    const subject = await db().subjects.get(input.subjectId);
    if (!subject || subject.userId !== userId)
      return { ok: false as const, error: "Matéria não encontrada." };
  }

  const now = Date.now();
  await db().events.add({
    id: cuid(),
    userId,
    subjectId: input.subjectId ?? null,
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
  const ts = new Date(input.date).getTime();
  if (Number.isNaN(ts)) return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  const event = await db().events.get(input.id);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };

  await db().events.update(input.id, {
    title,
    type: input.type.toUpperCase() as "EXAM" | "TASK" | "CLASS" | "CUSTOM",
    date: ts,
    subjectId: input.subjectId ?? null,
    notes: input.notes?.trim() || null,
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function toggleEventDone(eventId: string) {
  const userId = getCurrentUserId();
  const event = await db().events.get(eventId);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };
  await db().events.update(eventId, {
    done: !event.done,
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteEvent(eventId: string) {
  const userId = getCurrentUserId();
  const event = await db().events.get(eventId);
  if (!event || event.userId !== userId)
    return { ok: false as const, error: "Evento não encontrado." };
  await db().events.delete(eventId);
  invalidateAll();
  return { ok: true as const };
}
