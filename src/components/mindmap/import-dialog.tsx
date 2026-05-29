"use client";

import * as React from "react";
import { FileUp, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { importSlidesIntoMap } from "@/features/mindmaps/actions";

type Props = {
  open: boolean;
  mapId: string;
  /** Salva o estado atual do canvas antes de importar (evita perder posições). */
  flush: () => Promise<void>;
  onClose: () => void;
  onImported: (count: number) => void;
};

export function ImportDialog({ open, mapId, flush, onClose, onImported }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    await flush();
    const res = await importSlidesIntoMap(mapId, Array.from(list));
    setBusy(false);
    if (res.ok) {
      onImported(res.count);
      onClose();
    } else {
      setError(res.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold">Importar slides</h3>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              No Canva: Compartilhar → Baixar → PDF ou imagens. Cada slide vira
              um nó no mapa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            aria-label="Fechar"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={[
            "mt-4 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-[var(--color-ring)] bg-[var(--color-accent)]"
              : "border-[var(--color-border)] hover:bg-[var(--color-accent)]",
          ].join(" ")}
        >
          {busy ? (
            <>
              <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
              <span className="text-sm">Processando…</span>
            </>
          ) : (
            <>
              <FileUp className="size-6 text-[var(--color-muted-foreground)]" />
              <span className="text-sm font-medium">
                Arraste arquivos ou clique para escolher
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                PDF, PNG, JPG ou WebP
              </span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
