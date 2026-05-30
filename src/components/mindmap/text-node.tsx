"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useMindMapCtx } from "./editor-context";

export type TextNodeData = { text?: string; color?: string | null };

export function TextNode({ id, data, selected }: NodeProps) {
  const d = data as TextNodeData;
  const { updateNodeText } = useMindMapCtx();
  const rows = Math.max(1, (d.text ?? "").split("\n").length);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 shadow-sm transition-colors",
        selected ? "border-[var(--color-ring)]" : "border-[var(--color-border)]"
      )}
      style={{
        minWidth: 160,
        background: d.color ?? "var(--color-card)",
        color: "var(--color-foreground)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!size-2" />
      <textarea
        className="nodrag nowheel w-full resize-none bg-transparent text-sm leading-snug outline-none placeholder:text-[var(--color-muted-foreground)]"
        rows={rows}
        value={d.text ?? ""}
        onChange={(e) => updateNodeText(id, e.target.value)}
        placeholder="Digite…"
      />
      <Handle type="source" position={Position.Bottom} className="!size-2" />
    </div>
  );
}
