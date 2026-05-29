"use client";

import type { Table } from "dexie";

import { db } from "./index";
import { getCurrentUserId } from "@/lib/auth";
import type { SyncTableName } from "./schema";

// Acesso dinâmico à tabela sem brigar com os tipos por-tabela do Dexie.
function ref(name: SyncTableName): Table<Record<string, unknown>, string> {
  return (db() as unknown as Record<string, Table<Record<string, unknown>, string>>)[
    name
  ];
}

/**
 * Adiciona uma linha carimbando metadados de sync (_dirty=1, updatedAt).
 * A linha já vem com createdAt/updatedAt das actions; aqui garantimos os campos.
 */
export async function writeAdd<T extends { id: string; updatedAt?: number }>(
  table: SyncTableName,
  row: T
): Promise<void> {
  await ref(table).add({
    ...row,
    updatedAt: row.updatedAt ?? Date.now(),
    _dirty: 1,
  });
}

export async function writeBulkAdd<T extends { id: string; updatedAt?: number }>(
  table: SyncTableName,
  rows: T[]
): Promise<void> {
  const now = Date.now();
  await ref(table).bulkAdd(
    rows.map((r) => ({ ...r, updatedAt: r.updatedAt ?? now, _dirty: 1 }))
  );
}

/** Atualização parcial: sempre bumpa updatedAt e marca _dirty. */
export async function writeUpdate(
  table: SyncTableName,
  id: string,
  changes: Record<string, unknown>
): Promise<void> {
  await ref(table).update(id, { ...changes, updatedAt: Date.now(), _dirty: 1 });
}

/**
 * Delete = hard-delete local + lápide dirty (propaga no push).
 * Reads nunca veem a linha (some na hora), sem risco de "fantasma".
 */
export async function writeDelete(
  table: SyncTableName,
  id: string
): Promise<void> {
  const now = Date.now();
  const userId = getCurrentUserId();
  await db().transaction("rw", ref(table), db()._tombstones, async () => {
    await ref(table).delete(id);
    await db()._tombstones.put({
      key: `${table}:${id}`,
      table,
      rowId: id,
      userId,
      deletedAt: now,
      _dirty: 1,
    });
  });
}

export async function writeBulkDelete(
  table: SyncTableName,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const now = Date.now();
  const userId = getCurrentUserId();
  await db().transaction("rw", ref(table), db()._tombstones, async () => {
    await ref(table).bulkDelete(ids);
    await db()._tombstones.bulkPut(
      ids.map((id) => ({
        key: `${table}:${id}`,
        table,
        rowId: id,
        userId,
        deletedAt: now,
        _dirty: 1 as const,
      }))
    );
  });
}
