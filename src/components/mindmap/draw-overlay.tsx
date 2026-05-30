"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";

export interface CommittedStroke {
  x: number;
  y: number;
  width: number;
  height: number;
  d: string;
  stroke: string;
  strokeWidth: number;
}

interface DrawOverlayProps {
  penColor: string;
  penWidth: number;
  onCommit: (stroke: CommittedStroke) => void;
}

/**
 * Camada transparente por cima do canvas (só ativa no modo caneta). Captura o
 * traço à mão livre em coordenadas de tela pra preview e em coordenadas de
 * fluxo pra commitar como nó "draw".
 */
export function DrawOverlay({ penColor, penWidth, onCommit }: DrawOverlayProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [screenPts, setScreenPts] = React.useState<{ x: number; y: number }[]>([]);
  const flowPts = React.useRef<{ x: number; y: number }[]>([]);
  const drawing = React.useRef(false);

  const start = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drawing.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = ref.current!.getBoundingClientRect();
    flowPts.current = [screenToFlowPosition({ x: e.clientX, y: e.clientY })];
    setScreenPts([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const rect = ref.current!.getBoundingClientRect();
    flowPts.current.push(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    setScreenPts((p) => [...p, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const pts = flowPts.current;
    flowPts.current = [];
    setScreenPts([]);
    if (pts.length < 2) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = penWidth + 2;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const d = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x - minX).toFixed(1)},${(p.y - minY).toFixed(1)}`)
      .join(" ");

    onCommit({ x: minX, y: minY, width, height, d, stroke: penColor, strokeWidth: penWidth });
  };

  const screenD = screenPts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-[5] cursor-crosshair touch-none"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
    >
      {screenPts.length > 1 && (
        <svg className="pointer-events-none absolute inset-0 size-full">
          <path
            d={screenD}
            fill="none"
            stroke={penColor}
            strokeWidth={penWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
