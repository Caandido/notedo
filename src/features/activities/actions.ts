"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import { dateInputToMs } from "@/lib/utils";
import type {
  ActivityRow,
  ActivityStatus,
  ActivityType,
} from "@/lib/db/schema";

const TYPES: ActivityType[] = [
  "ATIVIDADE",
  "REDACAO",
  "TRABALHO",
  "EXERCICIO",
  "PROVA",
];
const STATUSES: ActivityStatus[] = ["TODO", "DOING", "DONE"];

/**
 * Mantém um evento-espelho na tabela `events` (mesmo id da atividade) pra o
 * prazo aparecer no Calendário. Sem prazo => remove o espelho.
 */
async function syncMirrorEvent(a: ActivityRow): Promise<void> {
  const existing = await db().events.get(a.id);
  if (a.dueDate == null) {
    if (existing) await writeDelete("events", a.id);
    return;
  }
  const fields = {
    userId: a.userId,
    subjectId: a.subjectId,
    type: "TASK" as const,
    title: a.title,
    notes: null,
    date: a.dueDate,
    done: a.status === "DONE",
  };
  if (existing) {
    await writeUpdate("events", a.id, fields);
  } else {
    await writeAdd("events", { id: a.id, createdAt: Date.now(), ...fields });
  }
}

async function nextOrder(userId: string, status: ActivityStatus): Promise<number> {
  const rows = await db()
    .activities.where("[userId+status]")
    .equals([userId, status])
    .toArray();
  return rows.reduce((max, r) => Math.max(max, r.order + 1), 0);
}

export type CreateActivityInput = {
  title: string;
  type: ActivityType;
  subjectId?: string | null;
  dueDate?: string | null;
  status?: ActivityStatus;
};

export async function createActivity(input: CreateActivityInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (title.length > 160) return { ok: false as const, error: "Título muito longo." };
  if (!TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };

  const dueDate = input.dueDate ? dateInputToMs(input.dueDate) : null;
  if (dueDate != null && Number.isNaN(dueDate))
    return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  if (input.subjectId) {
    const subject = await db().subjects.get(input.subjectId);
    if (!subject || subject.userId !== userId)
      return { ok: false as const, error: "Matéria não encontrada." };
  }

  const status = input.status ?? "TODO";
  const now = Date.now();
  const id = cuid();
  const row: ActivityRow = {
    id,
    userId,
    subjectId: input.subjectId ?? null,
    type: input.type,
    status,
    title,
    content: null,
    dueDate,
    grade: null,
    maxGrade: null,
    order: await nextOrder(userId, status),
    createdAt: now,
    updatedAt: now,
    _dirty: 1,
  };
  await writeAdd("activities", row);
  await syncMirrorEvent(row);
  invalidateAll();
  return { ok: true as const, id };
}

export type UpdateActivityInput = {
  id: string;
  title: string;
  type: ActivityType;
  subjectId?: string | null;
  dueDate?: string | null;
  grade?: number | null;
  maxGrade?: number | null;
};

export async function updateActivity(input: UpdateActivityInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (!TYPES.includes(input.type))
    return { ok: false as const, error: "Tipo inválido." };
  const dueDate = input.dueDate ? dateInputToMs(input.dueDate) : null;
  if (dueDate != null && Number.isNaN(dueDate))
    return { ok: false as const, error: "Data inválida." };

  const userId = getCurrentUserId();
  const a = await db().activities.get(input.id);
  if (!a || a.userId !== userId)
    return { ok: false as const, error: "Atividade não encontrada." };

  const changes = {
    title,
    type: input.type,
    subjectId: input.subjectId ?? null,
    dueDate,
    grade: input.grade ?? null,
    maxGrade: input.maxGrade ?? null,
  };
  await writeUpdate("activities", input.id, changes);
  await syncMirrorEvent({ ...a, ...changes });
  invalidateAll();
  return { ok: true as const };
}

export async function setActivityStatus(
  id: string,
  status: ActivityStatus,
  order?: number
) {
  if (!STATUSES.includes(status))
    return { ok: false as const, error: "Status inválido." };
  const userId = getCurrentUserId();
  const a = await db().activities.get(id);
  if (!a || a.userId !== userId)
    return { ok: false as const, error: "Atividade não encontrada." };

  const ord = order ?? (await nextOrder(userId, status));
  await writeUpdate("activities", id, { status, order: ord });
  await syncMirrorEvent({ ...a, status, order: ord });
  invalidateAll();
  return { ok: true as const };
}

/** Salva o corpo em texto rico (callback do RichEditor). */
export async function saveActivityContent(id: string, content: unknown) {
  const userId = getCurrentUserId();
  const a = await db().activities.get(id);
  if (!a || a.userId !== userId)
    return { ok: false as const, error: "Atividade não encontrada." };
  await writeUpdate("activities", id, { content });
  return { ok: true as const };
}

export async function deleteActivity(id: string) {
  const userId = getCurrentUserId();
  const a = await db().activities.get(id);
  if (!a || a.userId !== userId)
    return { ok: false as const, error: "Atividade não encontrada." };
  await writeDelete("activities", id);
  if (await db().events.get(id)) await writeDelete("events", id);
  invalidateAll();
  return { ok: true as const };
}
