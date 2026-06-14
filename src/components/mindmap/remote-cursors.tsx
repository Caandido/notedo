"use client";

import * as React from "react";
import { MousePointer2 } from "lucide-react";
import { ViewportPortal, useViewport } from "@xyflow/react";

import type { Peer } from "./use-collab";

/**
 * Cursores ao vivo dos outros colaboradores. Renderizados dentro do ViewportPortal
 * (coords do flow), com contra-escala (1/zoom) pra manter o tamanho na tela
 * constante independente do zoom. Re-renderiza ao mover/zoom via useViewport.
 */
export function RemoteCursors({ peers }: { peers: Peer[] }) {
  const { zoom } = useViewport();
  const visible = peers.filter((p) => p.x !== null && p.y !== null);
  if (!visible.length) return null;

  return (
    <ViewportPortal>
      {visible.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${p.x}px, ${p.y}px) scale(${1 / zoom})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            zIndex: 5000,
          }}
        >
          <MousePointer2
            className="size-4"
            style={{ color: p.color, fill: p.color }}
          />
          <span
            className="ml-3 -mt-1 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow"
            style={{ backgroundColor: p.color }}
          >
            {p.name}
          </span>
        </div>
      ))}
    </ViewportPortal>
  );
}
