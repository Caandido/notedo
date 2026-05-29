"use client";

// Transporte dos binários de slides (imagens) via Supabase Storage.
// A estrutura do mapa (nós/arestas) sincroniza pelo motor de tabelas; só as
// IMAGENS passam por aqui. Cache local em `_blobs` (Dexie) garante uso offline:
//   - import: grava blob local (_dirty=1) -> upload sobe e marca _dirty=0;
//   - render em outro device: pull traz o nó com o `path`, baixa do Storage
//     sob demanda e cacheia local (_dirty=0).

import { db } from "@/lib/db";
import { supabase, hasSupabaseConfig } from "./client";

export const SLIDES_BUCKET = "mindmap-slides";

/** Caminho canônico do objeto: <userId>/<mapId>/<nodeId>.png (1ª pasta = RLS). */
export function slidePath(userId: string, mapId: string, nodeId: string): string {
  return `${userId}/${mapId}/${nodeId}.png`;
}

/** Grava (ou substitui) um blob no cache local. dirty=1 => upload pendente. */
export async function cacheBlob(
  path: string,
  blob: Blob,
  dirty: 0 | 1
): Promise<void> {
  await db()._blobs.put({ path, blob, _dirty: dirty });
}

export async function getLocalBlob(path: string): Promise<Blob | null> {
  const row = await db()._blobs.get(path);
  return row?.blob ?? null;
}

/**
 * Retorna o blob da imagem: do cache local se existir; senão baixa do Storage
 * e cacheia. Null se offline/sem config/sem permissão (UI mostra placeholder).
 */
export async function ensureBlob(path: string): Promise<Blob | null> {
  const local = await getLocalBlob(path);
  if (local) return local;
  if (!hasSupabaseConfig()) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  try {
    const { data, error } = await supabase().storage
      .from(SLIDES_BUCKET)
      .download(path);
    if (error || !data) return null;
    await cacheBlob(path, data, 0);
    return data;
  } catch {
    return null;
  }
}

/** Sobe todos os blobs pendentes (_dirty=1). Chamado pelo syncAll (push). */
export async function uploadPendingBlobs(): Promise<void> {
  if (!hasSupabaseConfig()) return;
  const pending = await db()._blobs.where("_dirty").equals(1).toArray();
  for (const b of pending) {
    const { error } = await supabase().storage
      .from(SLIDES_BUCKET)
      .upload(b.path, b.blob, {
        upsert: true,
        contentType: b.blob.type || "image/png",
      });
    if (error) throw error;
    await db()._blobs.update(b.path, { _dirty: 0 });
  }
}

/** Best-effort: apaga os slides de um mapa (Storage + cache local). */
export async function deleteSlidesForMap(
  userId: string,
  mapId: string,
  paths: string[]
): Promise<void> {
  if (paths.length) {
    await db()._blobs.bulkDelete(paths);
  }
  if (!hasSupabaseConfig()) return;
  try {
    const prefix = `${userId}/${mapId}`;
    const { data } = await supabase().storage.from(SLIDES_BUCKET).list(prefix);
    const names = (data ?? []).map((f) => `${prefix}/${f.name}`);
    if (names.length) {
      await supabase().storage.from(SLIDES_BUCKET).remove(names);
    }
  } catch {
    // silencioso: limpeza de Storage é oportunista
  }
}
