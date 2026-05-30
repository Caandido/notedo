"use client";

import * as React from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { useMindMapCtx } from "./editor-context";
import { NodeToolbarChrome, STICKY_TEXT } from "./node-ui";

export type StickyNodeData = { text?: string; color?: string | null };

export function StickyNode({ id, data, selected }: NodeProps) {
  const d = data as StickyNodeData;
  const { updateNodeText, patchNodeData, deleteNode } = useMindMapCtx();
  const bg = d.color ?? "#fde68a";

  return (
    <div
      className={cn(
        "size-full overflow-hidden rounded-md p-2.5 shadow-md transition-shadow",
        selected ? "ring-2 ring-[var(--color-ring)]" : ""
      )}
      style={{ background: bg, minWidth: 140, minHeight: 100 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={90}
        lineClassName="!border-[var(--color-ring)]"
        handleClassName="!size-2 !rounded-sm !bg-[var(--color-ring)]"
      />
      <NodeToolbarChrome
        visible={!!selected}
        current={d.color ?? "#fde68a"}
        onPickColor={(c) => patchNodeData(id, { color: c })}
        onDelete={() => deleteNode(id)}
      />
      <Handle type="target" position={Position.Top} className="!size-2" />
      <Handle type="source" position={Position.Bottom} className="!size-2" />
      <textarea
        className="nodrag nowheel size-full resize-none bg-transparent text-sm font-medium leading-snug outline-none placeholder:text-black/40"
        style={{ color: STICKY_TEXT }}
        value={d.text ?? ""}
        onChange={(e) => updateNodeText(id, e.target.value)}
        placeholder="Anote algo…"
      />
    </div>
  );
}
