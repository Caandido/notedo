"use client";

import { cuid, db } from "@/lib/db";
import { writeAdd, writeDelete, writeUpdate } from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import type { MindMapData, MindMapNode } from "@/lib/db/schema";
import { importSlideFiles } from "@/lib/mindmap/import";
import { cacheBlob, slidePath } from "@/lib/sync/storage";

const EMPTY: MindMapData = { nodes: [], edges: [] };

/** Larguras de exibição padrão de cada tipo de nó (px). */
const SLIDE_W = 260;

/**
 * Pode editar o mapa? Dono, OU colaborador (mapa compartilhado comigo). Mapas
 * compartilhados têm o userId do DONO; a associação fica em `_mindmapShares`.
 */
async function canEditMap(
  map: { id: string; userId: string } | undefined,
  userId: string
): Promise<boolean> {
  if (!map) return false;
  if (map.userId === userId) return true;
  return Boolean(await db()._mindmapShares.get(map.id));
}

export async function createMindMap(input: { title?: string; subjectId?: string | null }) {
  const title = (input.title ?? "").trim() || "Mapa sem título";
  if (title.length > 120) return { ok: false as const, error: "Título muito longo." };

  const userId = getCurrentUserId();
  const now = Date.now();
  const id = cuid();
  await writeAdd("mindmaps", {
    id,
    userId,
    subjectId: input.subjectId ?? null,
    title,
    data: EMPTY,
    createdAt: now,
    updatedAt: now,
  });
  invalidateAll();
  return { ok: true as const, id };
}

export async function renameMindMap(id: string, title: string) {
  const t = title.trim();
  if (!t) return { ok: false as const, error: "Título obrigatório." };
  if (t.length > 120) return { ok: false as const, error: "Título muito longo." };
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!(await canEditMap(map, userId)))
    return { ok: false as const, error: "Mapa não encontrado." };
  await writeUpdate("mindmaps", id, { title: t });
  invalidateAll();
  return { ok: true as const };
}

/** Persiste a estrutura completa (chamado no autosave do editor). */
export async function saveMindMapData(id: string, data: MindMapData) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!(await canEditMap(map, userId)))
    return { ok: false as const, error: "Mapa não encontrado." };
  await writeUpdate("mindmaps", id, { data });
  return { ok: true as const };
}

export async function deleteMindMap(id: string) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!map || map.userId !== userId)
    return { ok: false as const, error: "Mapa não encontrado." };

  // Vai pra Lixeira: NÃO apaga os slides do Storage aqui (o mapa é restaurável).
  // A limpeza definitiva acontece na purga (após 12 dias / excluir definitivo).
  await writeDelete("mindmaps", id);
  invalidateAll();
  return { ok: true as const };
}

/**
 * Importa slides (PDF/imagens) como nós no mapa. Cacheia cada imagem local
 * (_dirty=1 -> upload no próximo sync) e adiciona os nós posicionados em grade.
 */
export async function importSlidesIntoMap(mapId: string, files: File[]) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(mapId);
  if (!(await canEditMap(map, userId)))
    return { ok: false as const, error: "Mapa não encontrado." };
  if (!map) return { ok: false as const, error: "Mapa não encontrado." };

  let slides;
  try {
    slides = await importSlideFiles(files);
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Falha ao ler os arquivos.",
    };
  }
  if (!slides.length)
    return { ok: false as const, error: "Nenhum slide ou imagem encontrado." };

  const existing = map.data?.nodes ?? [];
  // posiciona o novo lote abaixo do conteúdo atual, em grade de 4 colunas
  const baseY =
    existing.reduce((max, n) => Math.max(max, n.y + (n.height ?? 160)), 0) + 60;

  const newNodes: MindMapNode[] = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const nodeId = cuid();
    const path = slidePath(userId, mapId, nodeId);
    await cacheBlob(path, s.blob, 1);

    const height = Math.round(SLIDE_W * (s.h / Math.max(1, s.w)));
    newNodes.push({
      id: nodeId,
      kind: "slide",
      x: (i % 4) * (SLIDE_W + 48),
      y: baseY + Math.floor(i / 4) * (height + 48),
      width: SLIDE_W,
      height,
      slide: { path, w: s.w, h: s.h },
    });
  }

  const data: MindMapData = {
    nodes: [...existing, ...newNodes],
    edges: map.data?.edges ?? [],
  };
  await writeUpdate("mindmaps", mapId, { data });
  invalidateAll();
  return { ok: true as const, count: newNodes.length };
}
