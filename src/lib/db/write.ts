"use client";

import type { Table } from "dexie";

import { db } from "./index";
import { getCurrentUserId } from "@/lib/auth";
import { scheduleSync } from "@/lib/sync/engine";
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
  scheduleSync();
}

export async function writeBulkAdd<T extends { id: string; updatedAt?: number }>(
  table: SyncTableName,
  rows: T[]
): Promise<void> {
  const now = Date.now();
  await ref(table).bulkAdd(
    rows.map((r) => ({ ...r, updatedAt: r.updatedAt ?? now, _dirty: 1 }))
  );
  scheduleSync();
}

/** Atualização parcial: sempre bumpa updatedAt e marca _dirty. */
export async function writeUpdate(
  table: SyncTableName,
  id: string,
  changes: Record<string, unknown>
): Promise<void> {
  await ref(table).update(id, { ...changes, updatedAt: Date.now(), _dirty: 1 });
  scheduleSync();
}

/**
 * Carimbo de exclusão (ms). Uma ação de delete (que pode mexer em várias linhas
 * em cascata) deve usar UM único stamp pra todas as linhas — assim a Lixeira
 * agrupa o conjunto e o restore/purge operam no grupo inteiro.
 */
export function newTrashStamp(): number {
  return Date.now();
}

/**
 * "Excluir" agora = mandar pra Lixeira (soft-delete): carimba `trashedAt`.
 * O item some das listagens (reads filtram `trashedAt`), mas continua
 * restaurável por 12 dias. Sincroniza como uma atualização normal (_dirty=1);
 * a exclusão real (hard-delete) só acontece na purga/`writePurge`.
 */
export async function writeDelete(
  table: SyncTableName,
  id: string,
  stamp: number = Date.now()
): Promise<void> {
  await ref(table).update(id, {
    trashedAt: stamp,
    updatedAt: stamp,
    _dirty: 1,
  });
  scheduleSync();
}

export async function writeBulkDelete(
  table: SyncTableName,
  ids: string[],
  stamp: number = Date.now()
): Promise<void> {
  if (ids.length === 0) return;
  await ref(table)
    .where("id")
    .anyOf(ids)
    .modify({ trashedAt: stamp, updatedAt: stamp, _dirty: 1 });
  scheduleSync();
}

/** Tira da Lixeira (restaura): zera `trashedAt`. */
export async function writeRestore(
  table: SyncTableName,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const now = Date.now();
  await ref(table)
    .where("id")
    .anyOf(ids)
    .modify({ trashedAt: null, updatedAt: now, _dirty: 1 });
  scheduleSync();
}

/**
 * Exclusão DEFINITIVA = hard-delete local + lápide dirty (propaga no push).
 * Usado pela purga automática (12 dias) e pelo "excluir definitivo" da Lixeira.
 * (Era o comportamento antigo do writeDelete.)
 */
export async function writePurge(
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
  scheduleSync();
}
