"use client";

import * as React from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useMindMapCtx } from "./editor-context";
import { NodeToolbarChrome } from "./node-ui";

export type DrawNodeData = {
  draw?: { d: string; stroke: string; width: number; w: number; h: number } | null;
};

const PEN_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#0a0a0b", "#fafafa"];

export function DrawNode({ id, data, selected }: NodeProps) {
  const d = (data as DrawNodeData).draw;
  const { patchNodeData, deleteNode } = useMindMapCtx();
  if (!d) return null;

  return (
    <div className={cn("relative size-full", selected ? "outline-none" : "")}>
      <NodeResizer
        isVisible={selected}
        keepAspectRatio
        minWidth={20}
        minHeight={20}
        lineClassName="!border-[var(--color-ring)]"
        handleClassName="!size-2 !rounded-sm !bg-[var(--color-ring)]"
      />
      <NodeToolbarChrome visible={!!selected} onDelete={() => deleteNode(id)}>
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor do traço ${c}`}
            onClick={() => patchNodeData(id, { draw: { ...d, stroke: c } })}
            className={cn(
              "size-5 rounded-full border transition-transform hover:scale-110",
              d.stroke === c
                ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)]"
                : "border-black/20"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </NodeToolbarChrome>
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        viewBox={`0 0 ${d.w} ${d.h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={d.d}
          fill="none"
          stroke={d.stroke}
          strokeWidth={d.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
