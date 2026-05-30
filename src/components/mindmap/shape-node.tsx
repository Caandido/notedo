"use client";

import * as React from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import type { MindMapShape } from "@/lib/db/schema";
import { useMindMapCtx } from "./editor-context";
import { NodeToolbarChrome, STICKY_TEXT } from "./node-ui";

export type ShapeNodeData = {
  text?: string;
  color?: string | null;
  stroke?: string | null;
  shape?: MindMapShape;
};

export function ShapeNode({ id, data, selected }: NodeProps) {
  const d = data as ShapeNodeData;
  const { updateNodeText, patchNodeData, deleteNode } = useMindMapCtx();
  const shape = d.shape ?? "rect";
  const fill = d.color ?? "#bfdbfe";
  const stroke = d.stroke ?? "rgba(0,0,0,0.25)";

  return (
    <div
      className={cn("relative size-full", selected ? "outline-none" : "")}
      style={{ minWidth: 120, minHeight: 80 }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        lineClassName="!border-[var(--color-ring)]"
        handleClassName="!size-2 !rounded-sm !bg-[var(--color-ring)]"
      />
      <NodeToolbarChrome
        visible={!!selected}
        current={d.color ?? "#bfdbfe"}
        onPickColor={(c) => patchNodeData(id, { color: c })}
        onDelete={() => deleteNode(id)}
      />
      <Handle type="target" position={Position.Top} className="!size-2 !z-10" />
      <Handle type="source" position={Position.Bottom} className="!size-2 !z-10" />

      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {shape === "ellipse" ? (
          <ellipse
            cx="50"
            cy="50"
            rx="49"
            ry="49"
            fill={fill}
            stroke={stroke}
            strokeWidth={selected ? 2 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : shape === "diamond" ? (
          <polygon
            points="50,1 99,50 50,99 1,50"
            fill={fill}
            stroke={stroke}
            strokeWidth={selected ? 2 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="6"
            fill={fill}
            stroke={stroke}
            strokeWidth={selected ? 2 : 1.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center p-3">
        <textarea
          className="nodrag nowheel size-full resize-none bg-transparent text-center text-sm font-medium leading-snug outline-none placeholder:text-black/40"
          style={{ color: STICKY_TEXT }}
          value={d.text ?? ""}
          onChange={(e) => updateNodeText(id, e.target.value)}
          placeholder="Texto…"
        />
      </div>
    </div>
  );
}
