"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getBoardDetail } from "@/lib/queries";
import type { BoardColumn } from "@/lib/db/schema";
import type { CardListItem } from "@/lib/queries";
import {
  addColumn,
  createCard,
  deleteBoard,
  deleteColumn,
  moveCard,
  renameBoard,
  renameColumn,
  reorderColumns,
  setBoardColor,
} from "@/features/boards/actions";
import { BOARD_COLORS, PRIORITY_DOT } from "./board-styles";

type Drag = { kind: "card" | "column"; id: string } | null;

function formatDue(ms: number | null): string | null {
  if (ms == null) return null;
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function BoardKanban({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { data, loading } = useRepoQuery(() => getBoardDetail(boardId), [boardId]);
  const drag = React.useRef<Drag>(null);
  const [overCol, setOverCol] = React.useState<string | null>(null);

  if (loading && !data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
        Carregando…
      </p>
    );
  }
  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
        Projeto não encontrado.
      </p>
    );
  }

  const { board, cards } = data;
  const columnIds = board.columns.map((c) => c.id);

  const cardsOf = (colId: string) =>
    cards
      .filter((c) => c.columnId === colId)
      .sort((a, b) => a.order - b.order);

  async function onCardDrop(toColumnId: string, beforeId: string | null) {
    const d = drag.current;
    setOverCol(null);
    drag.current = null;
    if (d?.kind === "card") await moveCard(d.id, toColumnId, beforeId);
  }

  async function onColumnDrop(targetColId: string) {
    const d = drag.current;
    drag.current = null;
    if (d?.kind !== "column" || d.id === targetColId) return;
    const next = columnIds.filter((id) => id !== d.id);
    const ti = next.indexOf(targetColId);
    next.splice(ti, 0, d.id);
    await reorderColumns(board.id, next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BoardHeader
        id={board.id}
        name={board.name}
        color={board.color}
        onRename={(n) => void renameBoard(board.id, n)}
        onColor={(c) => void setBoardColor(board.id, c)}
        onDelete={async () => {
          if (!confirm(`Excluir o projeto "${board.name}" e todos os cards? Vai pra Lixeira.`))
            return;
          await deleteBoard(board.id);
        }}
      />

      <div className="flex flex-1 gap-3 overflow-x-auto px-4 pb-4 pt-3">
        {board.columns.map((col) => (
          <Column
            key={col.id}
            boardId={board.id}
            column={col}
            cards={cardsOf(col.id)}
            canDelete={board.columns.length > 1}
            isOver={overCol === col.id}
            color={board.color}
            onOpenCard={(id) => router.push(`/card?id=${id}&board=${board.id}`)}
            onDragStartCard={(id) => (drag.current = { kind: "card", id })}
            onDragStartColumn={(id) => (drag.current = { kind: "column", id })}
            getDrag={() => drag.current}
            onCardDropEnd={() => onCardDrop(col.id, null)}
            onCardDropBefore={(beforeId) => onCardDrop(col.id, beforeId)}
            onColumnDrop={() => onColumnDrop(col.id)}
            onHover={() => setOverCol(col.id)}
            onLeave={() => setOverCol((o) => (o === col.id ? null : o))}
          />
        ))}

        <AddColumn onAdd={(name) => void addColumn(board.id, name)} />
      </div>
    </div>
  );
}

// ── Header do quadro ─────────────────────────────────────────────────────────
function BoardHeader({
  id,
  name,
  color,
  onRename,
  onColor,
  onDelete,
}: {
  id: string;
  name: string;
  color: string;
  onRename: (name: string) => void;
  onColor: (color: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = React.useState(name);
  const [palette, setPalette] = React.useState(false);
  React.useEffect(() => setValue(name), [name, id]);

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
      <div className="relative">
        <button
          type="button"
          aria-label="Cor do projeto"
          onClick={() => setPalette((p) => !p)}
          className="size-4 rounded-full ring-2 ring-[var(--color-border)]"
          style={{ background: color }}
        />
        {palette && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPalette(false)} />
            <div className="absolute left-0 top-6 z-20 flex gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-lg">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => {
                    onColor(c);
                    setPalette(false);
                  }}
                  className={cn(
                    "size-5 rounded-full",
                    c === color && "ring-2 ring-offset-2 ring-offset-[var(--color-card)] ring-[var(--color-foreground)]"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value.trim() && value !== name && onRename(value.trim())}
        maxLength={80}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-base font-semibold outline-none focus:bg-[var(--color-card)]"
      />

      <button
        type="button"
        aria-label="Excluir projeto"
        onClick={onDelete}
        className="rounded-md p-2 text-[var(--color-muted-foreground)] transition-colors hover:text-rose-300"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

// ── Coluna ───────────────────────────────────────────────────────────────────
function Column({
  boardId,
  column,
  cards,
  canDelete,
  isOver,
  color,
  onOpenCard,
  onDragStartCard,
  onDragStartColumn,
  getDrag,
  onCardDropEnd,
  onCardDropBefore,
  onColumnDrop,
  onHover,
  onLeave,
}: {
  boardId: string;
  column: BoardColumn;
  cards: CardListItem[];
  canDelete: boolean;
  isOver: boolean;
  color: string;
  onOpenCard: (id: string) => void;
  onDragStartCard: (id: string) => void;
  onDragStartColumn: (id: string) => void;
  getDrag: () => Drag;
  onCardDropEnd: () => void;
  onCardDropBefore: (beforeId: string) => void;
  onColumnDrop: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(column.name);
  const [menu, setMenu] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  React.useEffect(() => setName(column.name), [column.name]);

  return (
    <div
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 transition-colors",
        isOver && "border-[var(--color-ring)] bg-[var(--color-accent)]/40"
      )}
      onDragOver={(e) => {
        // só prevê default p/ drop de coluna (cards têm handlers próprios)
        if (getDrag()?.kind === "column") e.preventDefault();
      }}
      onDrop={() => {
        if (getDrag()?.kind === "column") onColumnDrop();
      }}
    >
      {/* header da coluna (arrastável p/ reordenar) */}
      <div
        draggable={!editing}
        onDragStart={() => onDragStartColumn(column.id)}
        className="flex items-center gap-1 px-2 py-2"
      >
        <GripVertical className="size-3.5 shrink-0 cursor-grab text-[var(--color-muted-foreground)]" />
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (name.trim() && name !== column.name)
                void renameColumn(boardId, column.id, name.trim());
              else setName(column.name);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setName(column.name);
                setEditing(false);
              }
            }}
            maxLength={60}
            className="h-6 min-w-0 flex-1 rounded bg-[var(--color-background)] px-1.5 text-xs font-semibold outline-none focus:border-[var(--color-ring)]"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => setEditing(true)}
            className="min-w-0 flex-1 truncate text-left text-xs font-semibold"
            title="Duplo clique para renomear"
          >
            {column.name}
          </button>
        )}
        <span className="text-[11px] text-[var(--color-muted-foreground)]">{cards.length}</span>
        <div className="relative">
          <button
            type="button"
            aria-label="Opções da coluna"
            onClick={() => setMenu((m) => !m)}
            className="rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-7 z-20 w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-xs shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    setEditing(true);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left hover:bg-[var(--color-accent)]"
                >
                  Renomear
                </button>
                <button
                  type="button"
                  disabled={!canDelete}
                  onClick={() => {
                    setMenu(false);
                    if (!canDelete) return;
                    if (confirm("Excluir esta coluna? Os cards vão pra coluna vizinha."))
                      void deleteColumn(boardId, column.id);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-rose-300 hover:bg-[var(--color-accent)] disabled:opacity-40"
                >
                  Excluir coluna
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* corpo (cards) — área de drop p/ cards */}
      <div
        onDragOver={(e) => {
          if (getDrag()?.kind === "card") {
            e.preventDefault();
            onHover();
          }
        }}
        onDragLeave={onLeave}
        onDrop={(e) => {
          if (getDrag()?.kind === "card") {
            e.stopPropagation();
            onCardDropEnd();
          }
        }}
        className="flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
      >
        {cards.map((c) => (
          <article
            key={c.id}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStartCard(c.id);
            }}
            onDragOver={(e) => {
              if (getDrag()?.kind === "card") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              if (getDrag()?.kind === "card") {
                e.stopPropagation();
                onCardDropBefore(c.id);
              }
            }}
            onClick={() => onOpenCard(c.id)}
            className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-sm transition-colors hover:border-[var(--color-ring)]"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <p className="text-sm font-medium leading-snug">{c.title}</p>
            {(c.labels.length > 0 || c.priority !== "NONE" || c.dueDate != null) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-muted-foreground)]">
                {c.priority !== "NONE" && (
                  <span className={cn("size-2 rounded-full", PRIORITY_DOT[c.priority])} />
                )}
                {c.labels.slice(0, 3).map((l) => (
                  <span
                    key={l}
                    className="rounded bg-[var(--color-secondary)] px-1.5 py-0.5 text-[10px]"
                  >
                    {l}
                  </span>
                ))}
                {c.dueDate != null && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      c.dueDate < Date.now() && "text-rose-300"
                    )}
                  >
                    <CalendarClock className="size-3" />
                    {formatDue(c.dueDate)}
                  </span>
                )}
              </div>
            )}
          </article>
        ))}

        {adding ? (
          <QuickAdd
            onAdd={async (title) => {
              await createCard(boardId, column.id, title);
            }}
            onClose={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            <Plus className="size-3.5" />
            Adicionar card
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAdd({
  onAdd,
  onClose,
}: {
  onAdd: (title: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    const t = value.trim();
    if (!t) {
      onClose();
      return;
    }
    setBusy(true);
    await onAdd(t);
    setBusy(false);
    setValue("");
  }

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-1.5">
      <textarea
        autoFocus
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="Título do card…"
        className="w-full resize-none rounded bg-transparent px-1 text-sm outline-none"
      />
      <div className="flex items-center justify-end gap-1 pt-1">
        <button
          type="button"
          aria-label="Cancelar"
          onClick={onClose}
          className="rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Adicionar"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded bg-[var(--color-primary)] p-1 text-[var(--color-primary-foreground)] disabled:opacity-50"
        >
          <Check className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-44 shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] px-3 text-xs text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-ring)] hover:text-[var(--color-foreground)]"
      >
        <Plus className="size-3.5" />
        Adicionar coluna
      </button>
    );
  }

  function submit() {
    const n = value.trim();
    if (n) onAdd(n);
    setValue("");
    setOpen(false);
  }

  return (
    <div className="w-44 shrink-0">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setValue("");
            setOpen(false);
          }
        }}
        maxLength={60}
        placeholder="Nome da coluna"
        className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs outline-none focus:border-[var(--color-ring)]"
      />
    </div>
  );
}
