"use client";

import { db } from "@/lib/db";
import { writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import { supabase, hasSupabaseConfig } from "@/lib/sync/client";
import { syncAll } from "@/lib/sync/engine";

/** Gera um código de convite curto e único o suficiente. */
function genToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  }
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

/** Nome do usuário atual (pra aparecer pros outros colaboradores). */
async function currentName(): Promise<string> {
  try {
    const u = await db().users.get(getCurrentUserId());
    return u?.name?.trim() || "Colaborador";
  } catch {
    return "Colaborador";
  }
}

/** Extrai o código de convite de um link colado ou devolve o texto cru limpo. */
export function parseShareCode(input: string): string {
  const s = input.trim();
  const m = /[?&]join=([^&#\s]+)/.exec(s);
  if (m) return decodeURIComponent(m[1]);
  return s;
}

/**
 * Ativa o compartilhamento do mapa (só o dono). Gera o código de convite se
 * ainda não existir e devolve-o. Quem tiver o código entra como colaborador.
 */
export async function enableMindmapShare(id: string) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!map || map.userId !== userId)
    return { ok: false as const, error: "Só o dono pode compartilhar." };
  if (!hasSupabaseConfig())
    return { ok: false as const, error: "Entre na sua conta pra compartilhar." };
  let token = map.shareToken ?? null;
  if (!token) {
    token = genToken();
    await writeUpdate("mindmaps", id, { shareToken: token });
    void syncAll("share");
  }
  return { ok: true as const, token };
}

/** Desativa o compartilhamento (só o dono): limpa o código e remove colaboradores. */
export async function disableMindmapShare(id: string) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!map || map.userId !== userId)
    return { ok: false as const, error: "Só o dono pode alterar isto." };
  await writeUpdate("mindmaps", id, { shareToken: null });
  if (hasSupabaseConfig()) {
    try {
      await supabase().from("mindmap_collaborators").delete().eq("mindmap_id", id);
    } catch {
      /* best-effort */
    }
  }
  void syncAll("unshare");
  invalidateAll();
  return { ok: true as const };
}

export type Collaborator = {
  userId: string;
  name: string;
  role: string;
  joinedAt: number;
};

/** Lista os colaboradores do mapa (dono enxerga todos; via servidor). */
export async function getMindmapCollaborators(id: string): Promise<Collaborator[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    const { data, error } = await supabase()
      .from("mindmap_collaborators")
      .select("user_id, name, role, joined_at")
      .eq("mindmap_id", id);
    if (error || !data) return [];
    return data.map((r) => ({
      userId: r.user_id as string,
      name: (r.name as string) || "Colaborador",
      role: (r.role as string) || "editor",
      joinedAt: r.joined_at ? new Date(r.joined_at as string).getTime() : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Entra num mapa compartilhado pelo código (ou link). Registra como colaborador
 * no servidor, marca localmente e dispara um sync pra puxar o mapa.
 */
export async function joinMindmapByToken(input: string) {
  if (!hasSupabaseConfig())
    return { ok: false as const, error: "Entre na sua conta pra abrir mapas compartilhados." };
  const token = parseShareCode(input);
  if (!token) return { ok: false as const, error: "Informe o código de convite." };
  try {
    const { data, error } = await supabase().rpc("join_mindmap_by_token", {
      p_token: token,
      p_name: await currentName(),
    });
    if (error) return { ok: false as const, error: "Código inválido ou mapa indisponível." };
    const row = Array.isArray(data) ? data[0] : data;
    const mapId = row?.mindmap_id as string | undefined;
    if (!mapId) return { ok: false as const, error: "Código inválido." };

    await db()._mindmapShares.put({
      mapId,
      role: "editor",
      ownerName: null,
      joinedAt: Date.now(),
    });
    await syncAll("join");
    invalidateAll();
    return { ok: true as const, mapId };
  } catch {
    return { ok: false as const, error: "Falha ao entrar no mapa." };
  }
}

/** Sai de um mapa compartilhado (colaborador): remove acesso e cópia local. */
export async function leaveMindmap(id: string) {
  const userId = getCurrentUserId();
  if (hasSupabaseConfig()) {
    try {
      await supabase()
        .from("mindmap_collaborators")
        .delete()
        .eq("mindmap_id", id)
        .eq("user_id", userId);
    } catch {
      /* best-effort */
    }
  }
  await db()._mindmapShares.delete(id);
  // Remove a cópia local (não é meu mapa); o pull não vai mais trazê-lo.
  try {
    await db().mindmaps.delete(id);
  } catch {
    /* noop */
  }
  invalidateAll();
  return { ok: true as const };
}

/** Remove um colaborador do mapa (só o dono). */
export async function removeCollaborator(id: string, collabUserId: string) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!map || map.userId !== userId)
    return { ok: false as const, error: "Só o dono pode remover colaboradores." };
  if (!hasSupabaseConfig()) return { ok: false as const, error: "Sem conexão." };
  try {
    await supabase()
      .from("mindmap_collaborators")
      .delete()
      .eq("mindmap_id", id)
      .eq("user_id", collabUserId);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Falha ao remover." };
  }
}
