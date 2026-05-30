"use client";

import * as React from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Paleta estilo post-it (fundos claros, texto escuro legível).
export const STICKY_COLORS = [
  "#fde68a", // amarelo
  "#bbf7d0", // verde
  "#bfdbfe", // azul
  "#fbcfe8", // rosa
  "#ddd6fe", // roxo
  "#fed7aa", // laranja
  "#fecaca", // vermelho
  "#e5e7eb", // cinza
];

/** Texto escuro pra contraste em cima dos fundos claros da paleta. */
export const STICKY_TEXT = "#1f2937";

interface NodeToolbarChromeProps {
  visible: boolean;
  current?: string | null;
  onPickColor?: (color: string) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

/** Barra flutuante (cor + lixeira) que aparece quando o nó está selecionado. */
export function NodeToolbarChrome({
  visible,
  current,
  onPickColor,
  onDelete,
  children,
}: NodeToolbarChromeProps) {
  return (
    <NodeToolbar isVisible={visible} position={Position.Top} offset={8}>
      <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-md">
        {onPickColor &&
          STICKY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => onPickColor(c)}
              className={cn(
                "size-5 rounded-full border transition-transform hover:scale-110",
                current === c
                  ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)]"
                  : "border-black/10"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        {children}
        <button
          type="button"
          aria-label="Excluir nó"
          title="Excluir"
          onClick={onDelete}
          className="ml-0.5 flex size-6 items-center justify-center rounded text-[var(--color-muted-foreground)] transition-colors hover:bg-rose-500/15 hover:text-rose-500"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </NodeToolbar>
  );
}
