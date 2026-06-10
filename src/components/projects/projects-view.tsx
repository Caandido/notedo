"use client";

import * as React from "react";
import { KanbanSquare, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getBoardsForUser } from "@/lib/queries";
import { createBoard } from "@/features/boards/actions";
import { BoardKanban } from "./board-kanban";

export function ProjectsView({ initialBoardId }: { initialBoardId?: string }) {
  const { data: boards, loading } = useRepoQuery(() => getBoardsForUser(), []);
  const [activeId, setActiveId] = React.useState<string | null>(initialBoardId ?? null);
  const [creating, setCreating] = React.useState(false);

  // Seleção ativa: respeita o que existe; cai pro primeiro projeto.
  const active = React.useMemo(() => {
    if (!boards || boards.length === 0) return null;
    if (activeId && boards.some((b) => b.id === activeId)) return activeId;
    return boards[0].id;
  }, [boards, activeId]);

  async function onCreate(name: string) {
    const res = await createBoard(name);
    if (res.ok) setActiveId(res.id);
    setCreating(false);
  }

  if (loading && !boards) {
    return (
      <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Carregando…
      </p>
    );
  }

  if (!boards || boards.length === 0) {
    return <EmptyState creating={creating} setCreating={setCreating} onCreate={onCreate} />;
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col md:h-[calc(100dvh-3.5rem)] md:flex-row">
      {/* Trilho de projetos — sidebar no desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border)] p-2 md:flex">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Projetos
          </span>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {boards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveId(b.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                b.id === active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              <span className="text-[11px] opacity-60">{b.cardCount}</span>
            </button>
          ))}
        </div>
        {creating ? (
          <InlineCreate onCreate={onCreate} onClose={() => setCreating(false)} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreating(true)}
            className="mt-1 w-full justify-start gap-1.5"
          >
            <Plus className="size-3.5" />
            Novo projeto
          </Button>
        )}
      </aside>

      {/* Seletor de projetos — chips no mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2 md:hidden">
        {boards.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveId(b.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              b.id === active
                ? "border-[var(--color-ring)] bg-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"
            )}
          >
            <span className="size-2 rounded-full" style={{ background: b.color }} />
            {b.name}
          </button>
        ))}
        {creating ? (
          <InlineCreate onCreate={onCreate} onClose={() => setCreating(false)} compact />
        ) : (
          <button
            type="button"
            aria-label="Novo projeto"
            onClick={() => setCreating(true)}
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)]"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      {/* Quadro ativo */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {active && <BoardKanban key={active} boardId={active} />}
      </div>
    </div>
  );
}

function InlineCreate({
  onCreate,
  onClose,
  compact,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
  compact?: boolean;
}) {
  const [value, setValue] = React.useState("");
  function submit() {
    const n = value.trim();
    if (n) onCreate(n);
    else onClose();
  }
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") onClose();
      }}
      maxLength={80}
      placeholder="Nome do projeto"
      className={cn(
        "rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs outline-none focus:border-[var(--color-ring)]",
        compact ? "h-7 w-36 shrink-0" : "mt-1 h-9 w-full px-3"
      )}
    />
  );
}

function EmptyState({
  creating,
  setCreating,
  onCreate,
}: {
  creating: boolean;
  setCreating: (v: boolean) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-secondary)]">
        <KanbanSquare className="size-6 text-[var(--color-muted-foreground)]" />
      </div>
      <h2 className="text-lg font-semibold">Nenhum projeto ainda</h2>
      <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
        Crie um quadro Kanban por projeto de dev — com colunas editáveis e cards
        em texto rico (checklists, code blocks, links).
      </p>
      {creating ? (
        <div className="w-64">
          <InlineCreate onCreate={onCreate} onClose={() => setCreating(false)} />
        </div>
      ) : (
        <Button onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="size-4" />
          Criar primeiro projeto
        </Button>
      )}
    </div>
  );
}
