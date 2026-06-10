"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/editor/rich-editor";
import { getCard } from "@/lib/queries";
import {
  deleteCard,
  saveCardContent,
  setCardColor,
  updateCard,
} from "@/features/boards/actions";
import type { CardPriority } from "@/lib/db/schema";
import { CARD_COLORS, PRIORITIES, PRIORITY_LABELS } from "./board-styles";

const inputCls =
  "h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm outline-none focus:border-[var(--color-ring)]";

function msToDateInput(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

type Meta = {
  title: string;
  priority: CardPriority;
  dueDate: string;
  labels: string[];
};

export function CardEditor({ id, boardId }: { id: string; boardId?: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [content, setContent] = React.useState<unknown>(null);
  const [resolvedBoard, setResolvedBoard] = React.useState<string | undefined>(boardId);
  const [color, setColor] = React.useState<string | null>(null);
  const [labelInput, setLabelInput] = React.useState("");
  const [meta, setMeta] = React.useState<Meta>({
    title: "",
    priority: "NONE",
    dueDate: "",
    labels: [],
  });

  React.useEffect(() => {
    let active = true;
    void getCard(id).then((c) => {
      if (!active) return;
      if (!c) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      setResolvedBoard((b) => b ?? c.boardId);
      setContent(c.content ?? null);
      setColor(c.color ?? null);
      setMeta({
        title: c.title,
        priority: c.priority,
        dueDate: msToDateInput(c.dueDate),
        labels: c.labels ?? [],
      });
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const persist = React.useCallback(
    (next: Meta) => {
      setMeta(next);
      void updateCard({
        id,
        title: next.title,
        priority: next.priority,
        dueDate: next.dueDate || null,
        labels: next.labels,
      });
    },
    [id]
  );

  const saveContent = React.useCallback((c: unknown) => saveCardContent(id, c), [id]);

  function back() {
    router.push(resolvedBoard ? `/projects?board=${resolvedBoard}` : "/projects");
  }

  function addLabel() {
    const l = labelInput.trim();
    if (!l) return;
    if (meta.labels.includes(l)) {
      setLabelInput("");
      return;
    }
    persist({ ...meta, labels: [...meta.labels, l].slice(0, 12) });
    setLabelInput("");
  }

  function pickColor(c: string | null) {
    setColor(c);
    void setCardColor(id, c);
  }

  if (!loaded)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  if (missing)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">Card não encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
          Voltar
        </Button>
      </div>
    );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 backdrop-blur-md">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={back}>
          <ArrowLeft className="size-4" />
        </Button>
        <input
          value={meta.title}
          onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
          onBlur={() => meta.title.trim() && persist(meta)}
          maxLength={200}
          placeholder="Título do card"
          className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm font-semibold outline-none focus:bg-[var(--color-card)]"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir card"
          onClick={async () => {
            if (!confirm("Excluir este card? Vai pra Lixeira.")) return;
            await deleteCard(id);
            back();
          }}
        >
          <Trash2 className="size-4 text-[var(--color-muted-foreground)]" />
        </Button>
      </header>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Prioridade">
            <select
              className={inputCls}
              value={meta.priority}
              onChange={(e) => persist({ ...meta, priority: e.target.value as CardPriority })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cor">
            <div className="flex h-8 items-center gap-1.5">
              {CARD_COLORS.map((c) => (
                <button
                  key={c ?? "none"}
                  type="button"
                  aria-label={c ? `Cor ${c}` : "Sem cor (usa a do quadro)"}
                  onClick={() => pickColor(c)}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full ring-1 ring-[var(--color-border)]",
                    color === c && "ring-2 ring-[var(--color-foreground)]"
                  )}
                  style={c ? { background: c } : undefined}
                >
                  {c === null && <X className="size-3 text-[var(--color-muted-foreground)]" />}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              className={inputCls}
              value={meta.dueDate}
              onChange={(e) => persist({ ...meta, dueDate: e.target.value })}
            />
          </Field>
          <Field label="Etiquetas">
            <div className="flex flex-wrap items-center gap-1.5">
              {meta.labels.map((l) => (
                <span
                  key={l}
                  className="flex items-center gap-1 rounded bg-[var(--color-secondary)] px-2 py-1 text-xs"
                >
                  {l}
                  <button
                    type="button"
                    aria-label={`Remover ${l}`}
                    onClick={() =>
                      persist({ ...meta, labels: meta.labels.filter((x) => x !== l) })
                    }
                    className="text-[var(--color-muted-foreground)] hover:text-rose-300"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                onBlur={addLabel}
                placeholder="+ etiqueta"
                maxLength={24}
                className={`${inputCls} w-28`}
              />
            </div>
          </Field>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <RichEditor
            initialContent={content}
            onSave={saveContent}
            placeholder="Detalhes, specs, checklist, snippets…"
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-[var(--color-muted-foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}
