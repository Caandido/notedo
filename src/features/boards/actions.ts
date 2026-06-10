"use client";

import { cuid, db } from "@/lib/db";
import {
  newTrashStamp,
  writeAdd,
  writeBulkDelete,
  writeDelete,
  writeUpdate,
} from "@/lib/db/write";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";
import { dateInputToMs } from "@/lib/utils";
import type { BoardColumn, BoardRow, CardPriority, CardRow } from "@/lib/db/schema";

const PRIORITIES: CardPriority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

/** Colunas iniciais de um quadro novo. */
function defaultColumns(): BoardColumn[] {
  return [
    { id: cuid(), name: "Backlog" },
    { id: cuid(), name: "A fazer" },
    { id: cuid(), name: "Fazendo" },
    { id: cuid(), name: "Done" },
  ];
}

async function ownedBoard(id: string): Promise<BoardRow | null> {
  const userId = getCurrentUserId();
  const b = await db().boards.get(id);
  return b && b.userId === userId ? b : null;
}

async function ownedCard(id: string): Promise<CardRow | null> {
  const userId = getCurrentUserId();
  const c = await db().cards.get(id);
  return c && c.userId === userId ? c : null;
}

// ─── Quadros ─────────────────────────────────────────────────────────────────

export async function createBoard(name: string, color = "#7c7cf0") {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Nome obrigatório." };
  if (trimmed.length > 80) return { ok: false as const, error: "Nome muito longo." };

  const userId = getCurrentUserId();
  const existing = await db().boards.where("userId").equals(userId).toArray();
  const order = existing.reduce((max, b) => Math.max(max, b.order + 1), 0);

  const now = Date.now();
  const id = cuid();
  const row: BoardRow = {
    id,
    userId,
    name: trimmed,
    color,
    columns: defaultColumns(),
    order,
    createdAt: now,
    updatedAt: now,
    _dirty: 1,
  };
  await writeAdd("boards", row);
  invalidateAll();
  return { ok: true as const, id };
}

export async function renameBoard(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Nome obrigatório." };
  if (!(await ownedBoard(id)))
    return { ok: false as const, error: "Projeto não encontrado." };
  await writeUpdate("boards", id, { name: trimmed });
  invalidateAll();
  return { ok: true as const };
}

export async function setBoardColor(id: string, color: string) {
  if (!(await ownedBoard(id)))
    return { ok: false as const, error: "Projeto não encontrado." };
  await writeUpdate("boards", id, { color });
  invalidateAll();
  return { ok: true as const };
}

/** Manda o projeto inteiro pra Lixeira (board + todos os cards, mesmo stamp). */
export async function deleteBoard(id: string) {
  if (!(await ownedBoard(id)))
    return { ok: false as const, error: "Projeto não encontrado." };
  const stamp = newTrashStamp();
  const cardIds = (await db().cards.where("boardId").equals(id).toArray())
    .filter((c) => c.trashedAt == null)
    .map((c) => c.id);
  await writeBulkDelete("cards", cardIds, stamp);
  await writeDelete("boards", id, stamp);
  invalidateAll();
  return { ok: true as const };
}

// ─── Colunas (vivem no JSON do board) ────────────────────────────────────────

async function saveColumns(boardId: string, columns: BoardColumn[]) {
  await writeUpdate("boards", boardId, { columns });
}

export async function addColumn(boardId: string, name: string) {
  const trimmed = name.trim() || "Nova coluna";
  const board = await ownedBoard(boardId);
  if (!board) return { ok: false as const, error: "Projeto não encontrado." };
  const col: BoardColumn = { id: cuid(), name: trimmed.slice(0, 60) };
  await saveColumns(boardId, [...board.columns, col]);
  invalidateAll();
  return { ok: true as const, id: col.id };
}

export async function renameColumn(boardId: string, columnId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Nome obrigatório." };
  const board = await ownedBoard(boardId);
  if (!board) return { ok: false as const, error: "Projeto não encontrado." };
  const columns = board.columns.map((c) =>
    c.id === columnId ? { ...c, name: trimmed.slice(0, 60) } : c
  );
  await saveColumns(boardId, columns);
  invalidateAll();
  return { ok: true as const };
}

/** Remove uma coluna; os cards dela migram pra coluna vizinha. Nunca deixa 0. */
export async function deleteColumn(boardId: string, columnId: string) {
  const board = await ownedBoard(boardId);
  if (!board) return { ok: false as const, error: "Projeto não encontrado." };
  if (board.columns.length <= 1)
    return { ok: false as const, error: "O projeto precisa de ao menos uma coluna." };

  const idx = board.columns.findIndex((c) => c.id === columnId);
  if (idx === -1) return { ok: false as const, error: "Coluna não encontrada." };
  const fallback = board.columns[idx === 0 ? 1 : idx - 1];

  // Move os cards vivos da coluna removida pro fim da coluna vizinha.
  const cards = (await db().cards.where("[boardId+columnId]").equals([boardId, columnId]).toArray())
    .filter((c) => c.trashedAt == null);
  if (cards.length) {
    const dest = (await db().cards.where("[boardId+columnId]").equals([boardId, fallback.id]).toArray())
      .filter((c) => c.trashedAt == null);
    let order = dest.reduce((max, c) => Math.max(max, c.order + 1), 0);
    for (const c of cards) {
      await writeUpdate("cards", c.id, { columnId: fallback.id, order: order++ });
    }
  }

  await saveColumns(boardId, board.columns.filter((c) => c.id !== columnId));
  invalidateAll();
  return { ok: true as const };
}

export async function reorderColumns(boardId: string, orderedIds: string[]) {
  const board = await ownedBoard(boardId);
  if (!board) return { ok: false as const, error: "Projeto não encontrado." };
  const byId = new Map(board.columns.map((c) => [c.id, c]));
  const next = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is BoardColumn => c != null);
  // garante que nenhuma coluna suma se a lista vier incompleta
  if (next.length !== board.columns.length) return { ok: false as const, error: "Ordem inválida." };
  await saveColumns(boardId, next);
  invalidateAll();
  return { ok: true as const };
}

// ─── Cards ───────────────────────────────────────────────────────────────────

async function nextCardOrder(boardId: string, columnId: string): Promise<number> {
  const rows = await db()
    .cards.where("[boardId+columnId]")
    .equals([boardId, columnId])
    .toArray();
  return rows
    .filter((c) => c.trashedAt == null)
    .reduce((max, c) => Math.max(max, c.order + 1), 0);
}

export async function createCard(boardId: string, columnId: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false as const, error: "Título obrigatório." };
  if (trimmed.length > 200) return { ok: false as const, error: "Título muito longo." };
  const board = await ownedBoard(boardId);
  if (!board) return { ok: false as const, error: "Projeto não encontrado." };
  if (!board.columns.some((c) => c.id === columnId))
    return { ok: false as const, error: "Coluna inválida." };

  const now = Date.now();
  const id = cuid();
  const row: CardRow = {
    id,
    userId: board.userId,
    boardId,
    columnId,
    title: trimmed,
    content: null,
    labels: [],
    priority: "NONE",
    color: null,
    dueDate: null,
    order: await nextCardOrder(boardId, columnId),
    createdAt: now,
    updatedAt: now,
    _dirty: 1,
  };
  await writeAdd("cards", row);
  invalidateAll();
  return { ok: true as const, id };
}

export type UpdateCardInput = {
  id: string;
  title: string;
  labels?: string[];
  priority?: CardPriority;
  dueDate?: string | null;
};

export async function updateCard(input: UpdateCardInput) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Título obrigatório." };
  if (!(await ownedCard(input.id)))
    return { ok: false as const, error: "Card não encontrado." };
  const priority =
    input.priority && PRIORITIES.includes(input.priority) ? input.priority : "NONE";
  const dueDate = input.dueDate ? dateInputToMs(input.dueDate) : null;
  if (dueDate != null && Number.isNaN(dueDate))
    return { ok: false as const, error: "Data inválida." };
  const labels = (input.labels ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);

  await writeUpdate("cards", input.id, { title, labels, priority, dueDate });
  invalidateAll();
  return { ok: true as const };
}

/** Define (ou limpa, com null) a cor própria do card. */
export async function setCardColor(id: string, color: string | null) {
  if (!(await ownedCard(id)))
    return { ok: false as const, error: "Card não encontrado." };
  await writeUpdate("cards", id, { color });
  invalidateAll();
  return { ok: true as const };
}

/** Salva o corpo em texto rico (callback do RichEditor). Sem invalidateAll
 * pra não remontar o editor durante a digitação (mesmo motivo das matérias). */
export async function saveCardContent(id: string, content: unknown) {
  if (!(await ownedCard(id)))
    return { ok: false as const, error: "Card não encontrado." };
  await writeUpdate("cards", id, { content });
  return { ok: true as const };
}

/**
 * Move um card pra `toColumnId`, inserindo ANTES de `beforeId` (ou no fim se
 * `beforeId` for null), e renumera as colunas afetadas (0..n) de forma
 * sequencial — sem ordem fracionária. Usar o id do card-alvo (em vez de um
 * índice) evita o off-by-one ao arrastar pra baixo na mesma coluna. Escala
 * pessoal: reescrever a coluna inteira é barato e evita empates.
 */
export async function moveCard(
  id: string,
  toColumnId: string,
  beforeId: string | null
) {
  const card = await ownedCard(id);
  if (!card) return { ok: false as const, error: "Card não encontrado." };
  const board = await ownedBoard(card.boardId);
  if (!board || !board.columns.some((c) => c.id === toColumnId))
    return { ok: false as const, error: "Coluna inválida." };

  const fromColumnId = card.columnId;
  const all = (await db().cards.where("boardId").equals(card.boardId).toArray())
    .filter((c) => c.trashedAt == null);

  const colCards = (colId: string) =>
    all
      .filter((c) => c.columnId === colId && c.id !== id)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

  const target = colCards(toColumnId);
  const at = beforeId ? target.findIndex((c) => c.id === beforeId) : -1;
  const clamped = at === -1 ? target.length : at;
  target.splice(clamped, 0, { ...card, columnId: toColumnId });

  // Renumera coluna destino.
  for (let i = 0; i < target.length; i++) {
    const c = target[i];
    if (c.id === id) {
      await writeUpdate("cards", id, { columnId: toColumnId, order: i });
    } else if (c.order !== i) {
      await writeUpdate("cards", c.id, { order: i });
    }
  }
  // Renumera coluna de origem (se diferente).
  if (fromColumnId !== toColumnId) {
    const source = colCards(fromColumnId);
    for (let i = 0; i < source.length; i++) {
      if (source[i].order !== i) await writeUpdate("cards", source[i].id, { order: i });
    }
  }
  invalidateAll();
  return { ok: true as const };
}

export async function deleteCard(id: string) {
  if (!(await ownedCard(id)))
    return { ok: false as const, error: "Card não encontrado." };
  await writeDelete("cards", id);
  invalidateAll();
  return { ok: true as const };
}
