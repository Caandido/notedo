"use client";

import type { Table } from "dexie";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { writePurge, writeRestore } from "@/lib/db/write";
import { TRASH_RETENTION_MS, TRASH_TABLES, type TrashTable } from "./retention";

function ref(name: TrashTable): Table<Record<string, unknown>, string> {
  return (db() as unknown as Record<string, Table<Record<string, unknown>, string>>)[
    name
  ];
}

/**
 * Coleta os ids na Lixeira (trashedAt != null) que casam com `match`, por tabela.
 * `match` recebe o trashedAt da linha.
 */
async function collectTrashed(
  match: (trashedAt: number) => boolean
): Promise<Map<TrashTable, string[]>> {
  const userId = getCurrentUserId();
  const out = new Map<TrashTable, string[]>();
  for (const table of TRASH_TABLES) {
    const rows = await ref(table).where("userId").equals(userId).toArray();
    const ids = rows
      .filter((r) => r.trashedAt != null && match(r.trashedAt as number))
      .map((r) => String(r.id));
    if (ids.length) out.set(table, ids);
  }
  return out;
}

/** Apaga definitivamente o que está na Lixeira há mais de 12 dias. */
export async function purgeExpiredTrash(): Promise<number> {
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  const map = await collectTrashed((t) => t < cutoff);
  let n = 0;
  for (const [table, ids] of map) {
    await writePurge(table, ids);
    n += ids.length;
  }
  return n;
}

/** Restaura um grupo (todos os itens com o mesmo stamp). */
export async function restoreTrashGroup(stamp: number): Promise<void> {
  const map = await collectTrashed((t) => t === stamp);
  for (const [table, ids] of map) await writeRestore(table, ids);
}

/** Exclui definitivamente um grupo (todos os itens com o mesmo stamp). */
export async function purgeTrashGroup(stamp: number): Promise<void> {
  const map = await collectTrashed((t) => t === stamp);
  for (const [table, ids] of map) await writePurge(table, ids);
}

/** Esvazia a Lixeira inteira (exclusão definitiva de tudo). */
export async function emptyTrash(): Promise<number> {
  const map = await collectTrashed(() => true);
  let n = 0;
  for (const [table, ids] of map) {
    await writePurge(table, ids);
    n += ids.length;
  }
  return n;
}
