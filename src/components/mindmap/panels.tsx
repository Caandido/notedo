"use client";

import * as React from "react";
import type { Edge } from "@xyflow/react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowRight,
  Minus,
  Spline,
  Trash2,
  Waypoints,
} from "lucide-react";

import { cn } from "@/lib/utils";

const EDGE_COLORS = ["#94a3b8", "#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];

export type EdgePatch = Partial<{
  variant: "default" | "straight" | "smoothstep";
  color: string | null;
  arrow: boolean;
  label: string;
}>;

/** Painel de estilo da aresta selecionada (topo, centralizado). */
export function EdgePanel({
  edge,
  onChange,
  onDelete,
}: {
  edge: Edge;
  onChange: (patch: EdgePatch) => void;
  onDelete: () => void;
}) {
  const d = edge.data as { variant?: string; color?: string | null; arrow?: boolean } | undefined;
  const variant = (d?.variant as string) ?? "default";
  const color = d?.color ?? "#94a3b8";
  const arrow = d?.arrow !== false;

  return (
    <Bar>
      <Seg>
        <IconBtn icon={Spline} label="Curva" active={variant === "default"} onClick={() => onChange({ variant: "default" })} />
        <IconBtn icon={Minus} label="Reta" active={variant === "straight"} onClick={() => onChange({ variant: "straight" })} />
        <IconBtn icon={Waypoints} label="Em degraus" active={variant === "smoothstep"} onClick={() => onChange({ variant: "smoothstep" })} />
      </Seg>
      <Divider />
      <Seg>
        {EDGE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            onClick={() => onChange({ color: c })}
            className={cn(
              "size-5 rounded-full border transition-transform hover:scale-110",
              color === c ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)]" : "border-black/20"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </Seg>
      <Divider />
      <IconBtn icon={ArrowRight} label="Seta" active={arrow} onClick={() => onChange({ arrow: !arrow })} />
      <input
        value={(edge.label as string) ?? ""}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="rótulo…"
        maxLength={60}
        className="h-7 w-24 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs outline-none focus:border-[var(--color-ring)]"
      />
      <Divider />
      <IconBtn icon={Trash2} label="Excluir aresta" onClick={onDelete} danger />
    </Bar>
  );
}

/** Painel de alinhamento (aparece com 2+ nós selecionados). */
export function AlignPanel({
  onAlign,
  onDistribute,
}: {
  onAlign: (a: "left" | "center-h" | "right" | "top" | "middle-v" | "bottom") => void;
  onDistribute: (axis: "h" | "v") => void;
}) {
  return (
    <Bar>
      <Seg>
        <IconBtn icon={AlignStartVertical} label="Alinhar à esquerda" onClick={() => onAlign("left")} />
        <IconBtn icon={AlignCenterVertical} label="Centralizar horizontal" onClick={() => onAlign("center-h")} />
        <IconBtn icon={AlignEndVertical} label="Alinhar à direita" onClick={() => onAlign("right")} />
      </Seg>
      <Divider />
      <Seg>
        <IconBtn icon={AlignStartHorizontal} label="Alinhar ao topo" onClick={() => onAlign("top")} />
        <IconBtn icon={AlignCenterHorizontal} label="Centralizar vertical" onClick={() => onAlign("middle-v")} />
        <IconBtn icon={AlignEndHorizontal} label="Alinhar embaixo" onClick={() => onAlign("bottom")} />
      </Seg>
      <Divider />
      <Seg>
        <IconBtn icon={AlignHorizontalDistributeCenter} label="Distribuir horizontal" onClick={() => onDistribute("h")} />
        <IconBtn icon={AlignVerticalDistributeCenter} label="Distribuir vertical" onClick={() => onDistribute("v")} />
      </Seg>
    </Bar>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg">
      {children}
    </div>
  );
}
function Seg({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}
function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />;
}
function IconBtn({
  icon: Icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex size-7 items-center justify-center rounded text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
        active && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]",
        danger && "hover:bg-rose-500/15 hover:text-rose-500"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
