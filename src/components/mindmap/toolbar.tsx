"use client";

import * as React from "react";
import {
  Circle,
  Diamond,
  FileText,
  Frame,
  Image as ImageIcon,
  MousePointer2,
  Pencil,
  Square,
  StickyNote,
  Type,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ToolId =
  | "select"
  | "sticky"
  | "rect"
  | "ellipse"
  | "diamond"
  | "text"
  | "rich"
  | "frame"
  | "draw";

const PEN_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#0a0a0b"];
const PEN_WIDTHS = [2, 4, 8];

interface ToolbarProps {
  tool: ToolId;
  setTool: (t: ToolId) => void;
  onImage: () => void;
  onImport: () => void;
  penColor: string;
  setPenColor: (c: string) => void;
  penWidth: number;
  setPenWidth: (w: number) => void;
}

export function MindMapToolbar({
  tool,
  setTool,
  onImage,
  onImport,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
}: ToolbarProps) {
  const [shapeOpen, setShapeOpen] = React.useState(false);
  const shapeActive = tool === "rect" || tool === "ellipse" || tool === "diamond";

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
      <div className="flex flex-col gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg">
        <ToolBtn icon={MousePointer2} label="Selecionar (V)" active={tool === "select"} onClick={() => setTool("select")} />
        <ToolBtn icon={StickyNote} label="Post-it (N)" active={tool === "sticky"} onClick={() => setTool("sticky")} />

        {/* Forma com popover */}
        <div className="relative">
          <ToolBtn
            icon={shapeActive ? (tool === "ellipse" ? Circle : tool === "diamond" ? Diamond : Square) : Square}
            label="Forma (S)"
            active={shapeActive}
            onClick={() => {
              setShapeOpen((o) => !o);
              if (!shapeActive) setTool("rect");
            }}
          />
          {shapeOpen && (
            <div className="absolute left-full top-0 ml-1 flex gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg">
              <ToolBtn icon={Square} label="Retângulo" active={tool === "rect"} onClick={() => { setTool("rect"); setShapeOpen(false); }} />
              <ToolBtn icon={Circle} label="Elipse" active={tool === "ellipse"} onClick={() => { setTool("ellipse"); setShapeOpen(false); }} />
              <ToolBtn icon={Diamond} label="Losango" active={tool === "diamond"} onClick={() => { setTool("diamond"); setShapeOpen(false); }} />
            </div>
          )}
        </div>

        <ToolBtn icon={Type} label="Texto (T)" active={tool === "text"} onClick={() => setTool("text")} />
        <ToolBtn icon={FileText} label="Nota rica (R)" active={tool === "rich"} onClick={() => setTool("rich")} />
        <ToolBtn icon={Frame} label="Moldura (F)" active={tool === "frame"} onClick={() => setTool("frame")} />
        <ToolBtn icon={Pencil} label="Desenhar (D)" active={tool === "draw"} onClick={() => setTool("draw")} />

        <div className="my-0.5 h-px bg-[var(--color-border)]" />
        <ToolBtn icon={ImageIcon} label="Imagem" onClick={onImage} />
        <ToolBtn icon={Upload} label="Importar slides" onClick={onImport} />
      </div>

      {/* opções da caneta */}
      {tool === "draw" && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2 shadow-lg">
          <div className="flex gap-1">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                onClick={() => setPenColor(c)}
                className={cn(
                  "size-5 rounded-full border transition-transform hover:scale-110",
                  penColor === c ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)]" : "border-black/20"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            {PEN_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                aria-label={`Espessura ${w}`}
                onClick={() => setPenWidth(w)}
                className={cn(
                  "flex size-6 items-center justify-center rounded transition-colors hover:bg-[var(--color-accent)]",
                  penWidth === w && "bg-[var(--color-accent)]"
                )}
              >
                <span className="rounded-full bg-[var(--color-foreground)]" style={{ width: w + 2, height: w + 2 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
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
        "flex size-9 items-center justify-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
        active && "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
