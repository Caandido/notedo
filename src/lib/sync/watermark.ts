"use client";

import { db } from "@/lib/db";

/** Watermark de pull por tabela (maior updated_at já trazido, em ms). 0 = nunca. */
export async function getWatermark(table: string): Promise<number> {
  const row = await db()._sync_state.get(table);
  return row?.pulledThrough ?? 0;
}

export async function setWatermark(table: string, ms: number): Promise<void> {
  await db()._sync_state.put({ table, pulledThrough: ms });
}
