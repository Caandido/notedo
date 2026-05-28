"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export type EventType = "exam" | "task" | "class" | "custom";

export type CreateEventInput = {
  title: string;
  type: EventType;
  date: string;
  subjectId?: string | null;
  notes?: string;
};

const VALID_TYPES: EventType[] = ["exam", "task", "class", "custom"];

export async function createEvent(input: CreateEventInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 120)
    return { ok: false as const, error: "Título muito longo." };
  if (!VALID_TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime()))
    return { ok: false as const, error: "Data inválida." };

  const userId = await getCurrentUserId();

  if (input.subjectId) {
    const owned = await prisma.subject.findFirst({
      where: { id: input.subjectId, userId },
      select: { id: true },
    });
    if (!owned) return { ok: false as const, error: "Matéria não encontrada." };
  }

  await prisma.calendarEvent.create({
    data: {
      userId,
      subjectId: input.subjectId ?? undefined,
      type: input.type.toUpperCase() as "EXAM" | "TASK" | "CLASS" | "CUSTOM",
      title,
      date,
      notes: input.notes?.trim() || undefined,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const };
}

export type UpdateEventInput = {
  id: string;
  title: string;
  type: EventType;
  date: string;
  subjectId?: string | null;
  notes?: string;
};

export async function updateEvent(input: UpdateEventInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (!VALID_TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };
  const date = new Date(input.date);
  if (Number.isNaN(date.getTime()))
    return { ok: false as const, error: "Data inválida." };

  const userId = await getCurrentUserId();
  const updated = await prisma.calendarEvent.updateMany({
    where: { id: input.id, userId },
    data: {
      title,
      type: input.type.toUpperCase() as "EXAM" | "TASK" | "CLASS" | "CUSTOM",
      date,
      subjectId: input.subjectId ?? null,
      notes: input.notes?.trim() || null,
    },
  });
  if (updated.count === 0)
    return { ok: false as const, error: "Evento não encontrado." };

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const };
}

export async function toggleEventDone(eventId: string) {
  const userId = await getCurrentUserId();
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId },
    select: { id: true, done: true },
  });
  if (!event) return { ok: false as const, error: "Evento não encontrado." };
  await prisma.calendarEvent.update({
    where: { id: event.id },
    data: { done: !event.done },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteEvent(eventId: string) {
  const userId = await getCurrentUserId();
  const deleted = await prisma.calendarEvent.deleteMany({
    where: { id: eventId, userId },
  });
  if (deleted.count === 0)
    return { ok: false as const, error: "Evento não encontrado." };
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true as const };
}
