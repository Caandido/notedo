"use client";

import { db, resetDbSingleton } from "./index";
import { SYNC_TABLES } from "./schema";

const MIGRATED_KEY = "notedo:migrated";
const USER_KEY = "notedo:userId";

/**
 * No 1º login de um device, "adota" os dados anônimos locais para a conta:
 * reescreve userId em todas as tabelas para o id do Supabase e marca _dirty
 * (o primeiro syncAll empurra tudo pra nuvem). Roda uma vez por device.
 * topics ganham userId (backfill a partir da própria linha — já migrado junto).
 */
export async function migrateAnonToAccount(newUserId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY) === newUserId) return;

  const database = db();
  const tables = SYNC_TABLES.map((t) => database.table(t));
  await database.transaction("rw", tables, async () => {
    for (const t of SYNC_TABLES) {
      if (t === "users") continue; // perfil é keyed por uuid; tratado à parte
      await database
        .table(t)
        .toCollection()
        .modify((r: Record<string, unknown>) => {
          r.userId = newUserId;
          r._dirty = 1;
        });
    }
  });

  window.localStorage.setItem(MIGRATED_KEY, newUserId);
}

/**
 * Garante uma linha de perfil local para o usuário autenticado (cache).
 */
export async function ensureProfile(
  userId: string,
  data: { name?: string; email?: string; image?: string }
): Promise<void> {
  const now = Date.now();
  const existing = await db().users.get(userId);
  await db().users.put({
    id: userId,
    name: data.name?.trim() || existing?.name || "Você",
    email: data.email ?? existing?.email,
    image: data.image ?? existing?.image,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    _dirty: 1,
  });
}

/**
 * Apaga TODO o cache local (no sign-out) pra não vazar dados entre contas
 * no mesmo aparelho. Recria o singleton limpo.
 */
export async function wipeLocalData(): Promise<void> {
  if (typeof window === "undefined") return;
  await db().delete();
  resetDbSingleton();
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(MIGRATED_KEY);
}
