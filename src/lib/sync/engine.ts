"use client";

import type { Table } from "dexie";

import { db } from "@/lib/db";
import { invalidateAll } from "@/lib/db/use-repo";
import { getCurrentUserId } from "@/lib/auth";
import { supabase, hasSupabaseConfig } from "./client";
import { uploadPendingBlobs } from "./storage";
import { getWatermark, setWatermark } from "./watermark";
import {
  TABLE_DESCRIPTORS,
  fromRemote,
  markColumnUnsupported,
  setTrashedAtSupported,
  toRemote,
  type TableDesc,
} from "./tables";

const PAGE = 500;

function ref(name: string): Table<Record<string, unknown>, string> {
  return (db() as unknown as Record<string, Table<Record<string, unknown>, string>>)[
    name
  ];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const byLocal = new Map(TABLE_DESCRIPTORS.map((d) => [d.local, d]));

// ─── Push ────────────────────────────────────────────────────────────────

/** Erro de COLUNA inexistente no servidor (PostgREST PGRST204 / Postgres 42703). */
function isMissingColumn(error: unknown): boolean {
  const e = error as { code?: string } | null;
  return e?.code === "PGRST204" || e?.code === "42703";
}

/** Extrai o nome da coluna ausente da mensagem de erro (pra parar de enviá-la). */
function parseMissingColumn(error: unknown): string | null {
  const msg = (error as { message?: string } | null)?.message ?? "";
  const m = msg.match(/'([^']+)' column/) || msg.match(/column "([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * Erro de TABELA inexistente no servidor (SQL novo de boards/cards ainda não
 * rodado). PostgREST: PGRST205 ("Could not find the table ... in the schema
 * cache"); Postgres: 42P01 (undefined_table).
 */
function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  const msg = (e?.message ?? "").toLowerCase();
  return (
    e?.code === "PGRST205" ||
    e?.code === "42P01" ||
    msg.includes("could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

/**
 * Tabelas que o servidor ainda não tem (gate por sessão). Mantém a feature 100%
 * local até o usuário rodar o SQL — sem deixar o push lançar e abortar o pull
 * das demais tabelas. Some sozinho quando as tabelas existirem (novo load).
 */
const unsupportedTables = new Set<string>();

async function pushTable(desc: TableDesc): Promise<void> {
  if (unsupportedTables.has(desc.local)) return;
  const dirty = await ref(desc.local).where("_dirty").equals(1).toArray();
  if (!dirty.length) return;
  for (const part of chunk(dirty, desc.chunk)) {
    let { error } = await supabase()
      .from(desc.remote)
      .upsert(part.map((r) => toRemote(desc, r)), { onConflict: "id" });
    // Servidor sem alguma coluna nova (ex.: trashed_at, color — SQL não rodado):
    // marca a coluna, para de enviá-la e re-tenta. O resto do sync segue normal.
    let guard = 0;
    while (error && isMissingColumn(error) && guard++ < 6) {
      const col = parseMissingColumn(error);
      if (!col) break;
      markColumnUnsupported(col);
      if (col === "trashed_at") setTrashedAtSupported(false);
      ({ error } = await supabase()
        .from(desc.remote)
        .upsert(part.map((r) => toRemote(desc, r)), { onConflict: "id" }));
    }
    // Tabela ainda não existe no servidor: marca como não-suportada e segue —
    // o resto do sync (e a feature local) não é afetado.
    if (error && isMissingTable(error)) {
      unsupportedTables.add(desc.local);
      return;
    }
    if (error) throw error;
    const ids = part.map((r) => r.id as string);
    await ref(desc.local).where("id").anyOf(ids).modify({ _dirty: 0 });
  }
}

async function pushTombstones(): Promise<void> {
  const stones = await db()._tombstones.where("_dirty").equals(1).toArray();
  if (!stones.length) return;
  for (const s of stones) {
    const desc = byLocal.get(s.table as TableDesc["local"]);
    if (!desc) {
      await db()._tombstones.delete(s.key);
      continue;
    }
    if (unsupportedTables.has(desc.local)) continue; // tabela ainda não existe
    const iso = new Date(s.deletedAt).toISOString();
    const { error } = await supabase()
      .from(desc.remote)
      .update({ deleted_at: iso, updated_at: iso })
      .eq("id", s.rowId);
    if (error && isMissingTable(error)) {
      unsupportedTables.add(desc.local);
      continue;
    }
    if (error) throw error;
    await db()._tombstones.delete(s.key);
  }
}

// ─── Pull ────────────────────────────────────────────────────────────────

async function pullTable(desc: TableDesc): Promise<void> {
  if (unsupportedTables.has(desc.local)) return;
  let cursor = await getWatermark(desc.local);
  for (;;) {
    const { data, error } = await supabase()
      .from(desc.remote)
      .select("*")
      .gt("updated_at", new Date(cursor).toISOString())
      .order("updated_at", { ascending: true })
      .limit(PAGE);
    if (error && isMissingTable(error)) {
      unsupportedTables.add(desc.local);
      return;
    }
    if (error) throw error;
    if (!data || data.length === 0) break;

    await db().transaction("rw", ref(desc.local), db()._tombstones, async () => {
      for (const rr of data as Record<string, unknown>[]) {
        const incoming = new Date(rr.updated_at as string).getTime();
        const id = rr.id as string;
        const local = (await ref(desc.local).get(id)) as
          | { _dirty?: 0 | 1; updatedAt?: number }
          | undefined;

        cursor = Math.max(cursor, incoming);

        // LWW: não clobberar edição local mais nova/ainda não enviada.
        if (local && local._dirty && (local.updatedAt ?? 0) >= incoming) continue;
        if (local && (local.updatedAt ?? 0) > incoming) continue;

        if (rr.deleted_at) {
          if (local) await ref(desc.local).delete(id);
          await db()._tombstones.delete(`${desc.local}:${id}`);
        } else {
          await ref(desc.local).put({ ...fromRemote(desc, rr), _dirty: 0 });
        }
      }
    });

    await setWatermark(desc.local, cursor);
    if (data.length < PAGE) break;
  }
}

/**
 * Puxa os mapas mentais compartilhados COMIGO (de que sou colaborador, não dono).
 * O pull normal só varre por watermark; um mapa antigo recém-compartilhado pode
 * ter updated_at abaixo do watermark e nunca chegar — então buscamos por id.
 * Também reconcilia a tabela local `_mindmapShares` (usada pra listar esses
 * mapas junto dos meus). Silencioso se o SQL de colaboração ainda não rodou.
 */
async function pullSharedMindmaps(): Promise<void> {
  const desc = byLocal.get("mindmaps");
  if (!desc || unsupportedTables.has("mindmaps")) return;
  try {
    const userId = getCurrentUserId();
    const { data: collabs, error: cErr } = await supabase()
      .from("mindmap_collaborators")
      .select("mindmap_id, role")
      .eq("user_id", userId);
    if (cErr) return; // tabela/feature ainda não existe no servidor
    const shareIds = (collabs ?? []).map((c) => c.mindmap_id as string);

    const existing = await db()._mindmapShares.toArray();
    const prev = new Map(existing.map((s) => [s.mapId, s]));
    const stale = existing.filter((s) => !shareIds.includes(s.mapId)).map((s) => s.mapId);
    if (stale.length) await db()._mindmapShares.bulkDelete(stale);
    for (const c of collabs ?? []) {
      const mapId = c.mindmap_id as string;
      await db()._mindmapShares.put({
        mapId,
        role: (c.role as string) ?? "editor",
        ownerName: prev.get(mapId)?.ownerName ?? null,
        joinedAt: prev.get(mapId)?.joinedAt ?? Date.now(),
      });
    }
    if (!shareIds.length) return;

    const { data: maps, error: mErr } = await supabase()
      .from(desc.remote)
      .select("*")
      .in("id", shareIds);
    if (mErr || !maps) return;
    await db().transaction("rw", ref("mindmaps"), async () => {
      for (const rr of maps as Record<string, unknown>[]) {
        const id = rr.id as string;
        const incoming = new Date(rr.updated_at as string).getTime();
        const local = (await ref("mindmaps").get(id)) as
          | { _dirty?: 0 | 1; updatedAt?: number }
          | undefined;
        if (local && local._dirty && (local.updatedAt ?? 0) >= incoming) continue;
        if (local && (local.updatedAt ?? 0) > incoming) continue;
        if (rr.deleted_at) {
          if (local) await ref("mindmaps").delete(id);
        } else {
          await ref("mindmaps").put({ ...fromRemote(desc, rr), _dirty: 0 });
        }
      }
    });
  } catch {
    // silencioso: colaboração é best-effort, não pode quebrar o resto do sync
  }
}

// ─── Orquestração ──────────────────────────────────────────────────────────

/**
 * Conta quantas mudanças locais ainda NÃO foram enviadas ao servidor (linhas
 * `_dirty`, tombstones e blobs pendentes). Usado no logout pra não apagar dados
 * não sincronizados sem avisar. NÃO conta `users` (perfil não passa pelo motor).
 */
export async function countUnsynced(): Promise<number> {
  let n = 0;
  for (const d of TABLE_DESCRIPTORS) {
    n += await ref(d.local).where("_dirty").equals(1).count();
  }
  n += await db()._tombstones.where("_dirty").equals(1).count();
  n += await db()._blobs.where("_dirty").equals(1).count();
  return n;
}

let syncing = false;
let queued = false;

export async function syncAll(reason = "manual"): Promise<void> {
  if (!hasSupabaseConfig()) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (syncing) {
    queued = true;
    return;
  }
  syncing = true;
  try {
    await pushTombstones();
    await uploadPendingBlobs(); // slides antes da estrutura que os referencia
    for (const d of TABLE_DESCRIPTORS) await pushTable(d);
    for (const d of TABLE_DESCRIPTORS) await pullTable(d);
    await pullSharedMindmaps();
    invalidateAll();
  } catch (err) {
    console.warn(`[sync] falhou (${reason}):`, err);
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      void syncAll("queued");
    }
  }
}

// ─── Gatilhos ──────────────────────────────────────────────────────────────

let started = false;
let interval: ReturnType<typeof setInterval> | null = null;
let debounce: ReturnType<typeof setTimeout> | null = null;

function onOnline() {
  void syncAll("online");
}
function onVisible() {
  if (document.visibilityState === "visible") void syncAll("visible");
}

export async function startSyncForSession(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  interval = setInterval(() => {
    if (document.visibilityState === "visible") void syncAll("interval");
  }, 60_000);
  await syncAll("login");
}

export function stopSync(): void {
  started = false;
  if (interval) clearInterval(interval);
  if (debounce) clearTimeout(debounce);
  interval = null;
  debounce = null;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  }
}

/** Chamado após mutações locais (debounced) pra empurrar logo. */
export function scheduleSync(): void {
  if (!started) return;
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => void syncAll("debounce"), 1500);
}
