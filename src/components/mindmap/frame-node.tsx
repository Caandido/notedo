"use client";

import * as React from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useMindMapCtx } from "./editor-context";
import { NodeToolbarChrome } from "./node-ui";

export type FrameNodeData = { text?: string; color?: string | null };

const FRAME_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb923c", "#f472b6"];

export function FrameNode({ id, data, selected }: NodeProps) {
  const d = data as FrameNodeData;
  const { updateNodeText, patchNodeData, deleteNode } = useMindMapCtx();
  const accent = d.color ?? "#a78bfa";

  return (
    <div
      className={cn(
        "relative size-full rounded-xl border-2 transition-colors",
        selected ? "border-[var(--color-ring)]" : ""
      )}
      style={{
        minWidth: 240,
        minHeight: 180,
        borderColor: selected ? undefined : accent,
        background: `${accent}0f`,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={140}
        lineClassName="!border-[var(--color-ring)]"
        handleClassName="!size-2 !rounded-sm !bg-[var(--color-ring)]"
      />
      <NodeToolbarChrome
        visible={!!selected}
        onDelete={() => deleteNode(id)}
      >
        {FRAME_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor da moldura ${c}`}
            onClick={() => patchNodeData(id, { color: c })}
            className={cn(
              "size-5 rounded-full border transition-transform hover:scale-110",
              accent === c
                ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)]"
                : "border-black/10"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </NodeToolbarChrome>

      {/* barra de título — também serve de alça pra arrastar a moldura */}
      <div
        className="absolute -top-6 left-0 flex max-w-full items-center gap-1"
        style={{ color: accent }}
      >
        <input
          value={d.text ?? ""}
          onChange={(e) => updateNodeText(id, e.target.value)}
          placeholder="Seção"
          maxLength={60}
          className="nodrag h-5 min-w-0 bg-transparent text-xs font-semibold outline-none placeholder:opacity-60"
        />
      </div>
    </div>
  );
}
