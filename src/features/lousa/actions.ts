"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import type { LousaData, LousaRow } from "@/lib/db/schema";

async function ownedCanvas(id: string): Promise<LousaRow | null> {
  const userId = getCurrentUserId();
  const c = await db().canvases.get(id);
  return c && c.userId === userId ? c : null;
}

export async function createCanvas(title = "") {
  const userId = getCurrentUserId();
  const now = Date.now();
  const id = cuid();
  const row: LousaRow = {
    id,
    userId,
    title: title.trim().slice(0, 200),
    data: { elements: [] },
    createdAt: now,
    updatedAt: now,
    _dirty: 1,
  };
  await writeAdd("canvases", row);
  invalidateAll();
  return { ok: true as const, id };
}

export async function renameCanvas(id: string, title: string) {
  if (!(await ownedCanvas(id)))
    return { ok: false as const, error: "Lousa não encontrada." };
  await writeUpdate("canvases", id, { title: title.slice(0, 200) });
  invalidateAll();
  return { ok: true as const };
}

/** Salva os elementos do canvas (callback de autosave). Sem invalidateAll pra
 * não remontar o editor enquanto desenha. */
export async function saveCanvasData(id: string, data: LousaData) {
  if (!(await ownedCanvas(id)))
    return { ok: false as const, error: "Lousa não encontrada." };
  await writeUpdate("canvases", id, { data });
  return { ok: true as const };
}

export async function deleteCanvas(id: string) {
  if (!(await ownedCanvas(id)))
    return { ok: false as const, error: "Lousa não encontrada." };
  await writeDelete("canvases", id);
  invalidateAll();
  return { ok: true as const };
}
