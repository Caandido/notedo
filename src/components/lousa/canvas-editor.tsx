"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import katex from "katex";
import {
  ArrowLeft,
  ArrowUpRight,
  Circle,
  Eraser,
  Hand,
  Image as ImageIcon,
  Loader2,
  Minus,
  MousePointer2,
  Pencil,
  Redo2,
  Sigma,
  Square,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cuid } from "@/lib/db";
import { getCanvas } from "@/lib/queries";
import { deleteCanvas, renameCanvas, saveCanvasData } from "@/features/lousa/actions";
import type { LousaElement, LousaPoint } from "@/lib/db/schema";
import { PEN_COLORS, PEN_WIDTHS } from "./canvas-styles";

type Tool =
  | "select"
  | "hand"
  | "pen"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"
  | "math";
type VP = { x: number; y: number; scale: number };

// ── helpers de geometria ─────────────────────────────────────────────────────
function strokePath(pts: LousaPoint[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    d += ` Q ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function bboxOf(el: LousaElement): { x: number; y: number; w: number; h: number } {
  switch (el.t) {
    case "stroke": {
      const xs = el.pts.map((p) => p[0]);
      const ys = el.pts.map((p) => p[1]);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case "line":
    case "arrow":
    case "rect":
    case "ellipse": {
      const x = Math.min(el.x1, el.x2);
      const y = Math.min(el.y1, el.y2);
      return { x, y, w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
    }
    case "text": {
      const lines = el.text.split("\n");
      const w = Math.max(1, ...lines.map((l) => l.length)) * el.size * 0.55;
      return { x: el.x, y: el.y - el.size, w, h: lines.length * el.size * 1.25 };
    }
    case "math":
      return { x: el.x, y: el.y - el.size, w: el.latex.length * el.size * 0.5 + 20, h: el.size * 1.8 };
    case "image":
      return { x: el.x, y: el.y, w: el.w, h: el.h };
  }
}

function hitTest(el: LousaElement, wx: number, wy: number, thr: number): boolean {
  if (el.t === "stroke") {
    for (let i = 0; i < el.pts.length - 1; i++) {
      if (distToSeg(wx, wy, el.pts[i][0], el.pts[i][1], el.pts[i + 1][0], el.pts[i + 1][1]) <= thr + el.w)
        return true;
    }
    if (el.pts.length === 1) return Math.hypot(wx - el.pts[0][0], wy - el.pts[0][1]) <= thr + el.w;
    return false;
  }
  if (el.t === "line" || el.t === "arrow") {
    return distToSeg(wx, wy, el.x1, el.y1, el.x2, el.y2) <= thr + el.w;
  }
  const b = bboxOf(el);
  return wx >= b.x - thr && wx <= b.x + b.w + thr && wy >= b.y - thr && wy <= b.y + b.h + thr;
}

function translateEl(el: LousaElement, dx: number, dy: number): LousaElement {
  switch (el.t) {
    case "stroke":
      return { ...el, pts: el.pts.map(([x, y]) => [x + dx, y + dy] as LousaPoint) };
    case "line":
    case "arrow":
    case "rect":
    case "ellipse":
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
    default:
      return { ...el, x: el.x + dx, y: el.y + dy };
  }
}

function katexHtml(latex: string): string {
  try {
    return katex.renderToString(latex || "?", { throwOnError: false, displayMode: false });
  } catch {
    return '<span style="color:#fb7185">LaTeX inválido</span>';
  }
}

async function fileToDownscaledDataUrl(file: File, max = 1100): Promise<{ src: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    let { width, height } = img;
    if (width > max || height > max) {
      const r = Math.min(max / width, max / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const src = canvas.toDataURL("image/jpeg", 0.82);
    return { src, w: width, h: height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ── componente ───────────────────────────────────────────────────────────────
export function CanvasEditor({ id }: { id: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [tool, setTool] = React.useState<Tool>("pen");
  const [color, setColor] = React.useState(PEN_COLORS[0]);
  const [width, setWidth] = React.useState(PEN_WIDTHS[1]);
  const [elements, setElements] = React.useState<LousaElement[]>([]);
  const [draft, setDraft] = React.useState<LousaElement | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [vp, setVp] = React.useState<VP>({ x: 0, y: 0, scale: 1 });
  const [editing, setEditing] = React.useState<{ id: string; kind: "text" | "math" } | null>(null);
  const [past, setPast] = React.useState<LousaElement[][]>([]);
  const [future, setFuture] = React.useState<LousaElement[][]>([]);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const elementsRef = React.useRef(elements);
  elementsRef.current = elements;
  const vpRef = React.useRef(vp);
  vpRef.current = vp;
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const action = React.useRef<null | "pen" | "shape" | "move" | "pan" | "erase">(null);
  const penPts = React.useRef<LousaPoint[]>([]);
  const shapeStart = React.useRef<LousaPoint>([0, 0]);
  const shapeTool = React.useRef<"line" | "arrow" | "rect" | "ellipse">("line");
  const moveRef = React.useRef<{ id: string; last: LousaPoint }>({ id: "", last: [0, 0] });
  const panRef = React.useRef<{ sx: number; sy: number; vx: number; vy: number }>({ sx: 0, sy: 0, vx: 0, vy: 0 });
  const pointers = React.useRef<Map<number, LousaPoint>>(new Map());
  const pinch = React.useRef<null | { dist: number; mid: LousaPoint; vp0: VP }>(null);

  React.useEffect(() => {
    let active = true;
    void getCanvas(id).then((c) => {
      if (!active) return;
      if (!c) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      setTitle(c.title);
      setElements(c.data?.elements ?? []);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const scheduleSave = React.useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCanvasData(id, { elements: elementsRef.current });
    }, 600);
  }, [id]);

  React.useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  function snapshot() {
    setPast((p) => [...p, elementsRef.current].slice(-60));
    setFuture([]);
  }
  function undo() {
    setPast((p) => {
      if (!p.length) return p;
      setFuture((f) => [elementsRef.current, ...f].slice(0, 60));
      setElements(p[p.length - 1]);
      scheduleSave();
      return p.slice(0, -1);
    });
  }
  function redo() {
    setFuture((f) => {
      if (!f.length) return f;
      setPast((p) => [...p, elementsRef.current].slice(-60));
      setElements(f[0]);
      scheduleSave();
      return f.slice(1);
    });
  }

  function toWorld(clientX: number, clientY: number): LousaPoint {
    const rect = svgRef.current!.getBoundingClientRect();
    const v = vpRef.current;
    return [(clientX - rect.left - v.x) / v.scale, (clientY - rect.top - v.y) / v.scale];
  }
  function toLocal(clientX: number, clientY: number): LousaPoint {
    const rect = svgRef.current!.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  }

  function eraseAt(wx: number, wy: number) {
    const thr = 10 / vpRef.current.scale;
    setElements((els) => {
      const next = els.filter((el) => !hitTest(el, wx, wy, thr));
      return next.length === els.length ? els : next;
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (editing) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const local = toLocal(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, local);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a[0] - b[0], a[1] - b[1]),
        mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
        vp0: { ...vpRef.current },
      };
      action.current = null;
      setDraft(null);
      return;
    }
    if (pointers.current.size > 2) return;

    const [wx, wy] = toWorld(e.clientX, e.clientY);

    if (tool === "hand") {
      action.current = "pan";
      panRef.current = { sx: e.clientX, sy: e.clientY, vx: vpRef.current.x, vy: vpRef.current.y };
      return;
    }
    if (tool === "pen") {
      snapshot();
      action.current = "pen";
      penPts.current = [[wx, wy]];
      setDraft({ id: "draft", t: "stroke", pts: [[wx, wy]], color, w: width });
      return;
    }
    if (tool === "eraser") {
      snapshot();
      action.current = "erase";
      eraseAt(wx, wy);
      scheduleSave();
      return;
    }
    if (tool === "line" || tool === "arrow" || tool === "rect" || tool === "ellipse") {
      snapshot();
      action.current = "shape";
      shapeStart.current = [wx, wy];
      shapeTool.current = tool;
      setDraft({ id: "draft", t: tool, x1: wx, y1: wy, x2: wx, y2: wy, color, w: width });
      return;
    }
    if (tool === "text" || tool === "math") {
      snapshot();
      const el: LousaElement =
        tool === "text"
          ? { id: cuid(), t: "text", x: wx, y: wy, text: "", color, size: 24 }
          : { id: cuid(), t: "math", x: wx, y: wy, latex: "", size: 24 };
      setElements((els) => [...els, el]);
      setSelectedId(el.id);
      setEditing({ id: el.id, kind: tool });
      scheduleSave();
      return;
    }
    if (tool === "select") {
      const hit = [...elementsRef.current].reverse().find((el) => hitTest(el, wx, wy, 8 / vpRef.current.scale));
      if (hit) {
        setSelectedId(hit.id);
        snapshot();
        action.current = "move";
        moveRef.current = { id: hit.id, last: [wx, wy] };
      } else {
        setSelectedId(null);
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, toLocal(e.clientX, e.clientY));

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mid: LousaPoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const p = pinch.current;
      const scale = Math.max(0.2, Math.min(5, (p.vp0.scale * dist) / (p.dist || 1)));
      const worldMidX = (p.mid[0] - p.vp0.x) / p.vp0.scale;
      const worldMidY = (p.mid[1] - p.vp0.y) / p.vp0.scale;
      setVp({ x: mid[0] - worldMidX * scale, y: mid[1] - worldMidY * scale, scale });
      return;
    }
    if (!action.current) return;
    const [wx, wy] = toWorld(e.clientX, e.clientY);

    if (action.current === "pen") {
      penPts.current.push([wx, wy]);
      setDraft({ id: "draft", t: "stroke", pts: [...penPts.current], color, w: width });
    } else if (action.current === "shape") {
      const [sx, sy] = shapeStart.current;
      setDraft({ id: "draft", t: shapeTool.current, x1: sx, y1: sy, x2: wx, y2: wy, color, w: width });
    } else if (action.current === "erase") {
      eraseAt(wx, wy);
    } else if (action.current === "move") {
      const dx = wx - moveRef.current.last[0];
      const dy = wy - moveRef.current.last[1];
      moveRef.current.last = [wx, wy];
      setElements((els) => els.map((el) => (el.id === moveRef.current.id ? translateEl(el, dx, dy) : el)));
    } else if (action.current === "pan") {
      setVp((v) => ({ ...v, x: panRef.current.vx + (e.clientX - panRef.current.sx), y: panRef.current.vy + (e.clientY - panRef.current.sy) }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pinch.current && pointers.current.size < 2) pinch.current = null;

    if (action.current === "pen") {
      const pts = penPts.current;
      if (pts.length >= 1) {
        const el: LousaElement = { id: cuid(), t: "stroke", pts, color, w: width };
        setElements((els) => [...els, el]);
        scheduleSave();
      }
    } else if (action.current === "shape") {
      const [sx, sy] = shapeStart.current;
      const [wx, wy] = toWorld(e.clientX, e.clientY);
      if (Math.hypot(wx - sx, wy - sy) > 3) {
        const el: LousaElement = { id: cuid(), t: shapeTool.current, x1: sx, y1: sy, x2: wx, y2: wy, color, w: width };
        setElements((els) => [...els, el]);
        scheduleSave();
      }
    } else if (action.current === "erase" || action.current === "move") {
      scheduleSave();
    }
    setDraft(null);
    action.current = null;
  }

  // zoom no wheel (listener nativo, non-passive, pra poder preventDefault)
  React.useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const v = vpRef.current;
      if (e.ctrlKey || e.metaKey) {
        const rect = svgRef.current!.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = Math.exp(-e.deltaY * 0.0015);
        const scale = Math.max(0.2, Math.min(5, v.scale * factor));
        const wx = (mx - v.x) / v.scale;
        const wy = (my - v.y) / v.scale;
        setVp({ x: mx - wx * scale, y: my - wy * scale, scale });
      } else {
        setVp({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  // teclado: Delete remove selecionado; Ctrl+Z/Y desfaz/refaz
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        snapshot();
        setElements((els) => els.filter((el) => el.id !== selectedId));
        setSelectedId(null);
        scheduleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function zoomBy(factor: number) {
    const node = svgRef.current!;
    const rect = node.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const v = vpRef.current;
    const scale = Math.max(0.2, Math.min(5, v.scale * factor));
    const wx = (mx - v.x) / v.scale;
    const wy = (my - v.y) / v.scale;
    setVp({ x: mx - wx * scale, y: my - wy * scale, scale });
  }

  function patchElement(elId: string, patch: { text?: string; latex?: string }) {
    setElements((els) => els.map((el) => (el.id === elId ? ({ ...el, ...patch } as LousaElement) : el)));
  }

  function finishEditing() {
    if (!editing) return;
    const el = elementsRef.current.find((x) => x.id === editing.id);
    const empty = el && ((el.t === "text" && !el.text.trim()) || (el.t === "math" && !(el as Extract<LousaElement, { t: "math" }>).latex.trim()));
    if (empty) {
      setElements((els) => els.filter((x) => x.id !== editing.id));
    }
    setEditing(null);
    scheduleSave();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { src, w, h } = await fileToDownscaledDataUrl(file);
    const rect = svgRef.current!.getBoundingClientRect();
    const v = vpRef.current;
    const cx = (rect.width / 2 - v.x) / v.scale;
    const cy = (rect.height / 2 - v.y) / v.scale;
    const scale = Math.min(1, 360 / w);
    snapshot();
    const el: LousaElement = { id: cuid(), t: "image", x: cx - (w * scale) / 2, y: cy - (h * scale) / 2, w: w * scale, h: h * scale, src };
    setElements((els) => [...els, el]);
    setSelectedId(el.id);
    setTool("select");
    scheduleSave();
  }

  if (!loaded)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  if (missing)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">Lousa não encontrada.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/lousa")}>
          Voltar
        </Button>
      </div>
    );

  const allEls = draft ? [...elements, draft] : elements;
  const selEl = elements.find((e) => e.id === selectedId);
  const selBox = selEl ? bboxOf(selEl) : null;
  const editEl = editing ? elements.find((e) => e.id === editing.id) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-[var(--color-border)] px-3">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => router.push("/lousa")}>
          <ArrowLeft className="size-4" />
        </Button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void renameCanvas(id, title)}
          placeholder="Lousa sem título"
          className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm font-semibold outline-none focus:bg-[var(--color-card)]"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir lousa"
          onClick={async () => {
            if (!confirm("Excluir esta lousa? Vai pra Lixeira.")) return;
            await deleteCanvas(id);
            router.push("/lousa");
          }}
        >
          <Trash2 className="size-4 text-[var(--color-muted-foreground)]" />
        </Button>
      </header>

      {/* barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border)] px-2 py-1.5">
        <ToolBtn icon={MousePointer2} active={tool === "select"} onClick={() => setTool("select")} label="Selecionar" />
        <ToolBtn icon={Hand} active={tool === "hand"} onClick={() => setTool("hand")} label="Mover tela" />
        <ToolBtn icon={Pencil} active={tool === "pen"} onClick={() => setTool("pen")} label="Caneta" />
        <ToolBtn icon={Eraser} active={tool === "eraser"} onClick={() => setTool("eraser")} label="Borracha" />
        <Sep />
        <ToolBtn icon={Minus} active={tool === "line"} onClick={() => setTool("line")} label="Linha" />
        <ToolBtn icon={ArrowUpRight} active={tool === "arrow"} onClick={() => setTool("arrow")} label="Seta" />
        <ToolBtn icon={Square} active={tool === "rect"} onClick={() => setTool("rect")} label="Retângulo" />
        <ToolBtn icon={Circle} active={tool === "ellipse"} onClick={() => setTool("ellipse")} label="Círculo" />
        <Sep />
        <ToolBtn icon={Type} active={tool === "text"} onClick={() => setTool("text")} label="Texto" />
        <ToolBtn icon={Sigma} active={tool === "math"} onClick={() => setTool("math")} label="Equação" />
        <ToolBtn icon={ImageIcon} active={false} onClick={() => fileRef.current?.click()} label="Imagem" />
        <Sep />
        {/* cores */}
        <div className="flex items-center gap-1">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor ${c}`}
              onClick={() => setColor(c)}
              className={cn("size-5 rounded-full ring-1 ring-[var(--color-border)]", color === c && "ring-2 ring-[var(--color-foreground)]")}
              style={{ background: c }}
            />
          ))}
        </div>
        <Sep />
        {/* espessura */}
        <div className="flex items-center gap-1">
          {PEN_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              aria-label={`Espessura ${w}`}
              onClick={() => setWidth(w)}
              className={cn(
                "flex size-6 items-center justify-center rounded-md hover:bg-[var(--color-accent)]",
                width === w && "bg-[var(--color-accent)]"
              )}
            >
              <span className="rounded-full bg-current" style={{ width: Math.min(16, w + 1), height: Math.min(16, w + 1) }} />
            </button>
          ))}
        </div>
        <Sep />
        <ToolBtn icon={Undo2} active={false} onClick={undo} label="Desfazer" disabled={!past.length} />
        <ToolBtn icon={Redo2} active={false} onClick={redo} label="Refazer" disabled={!future.length} />
      </div>

      {/* canvas */}
      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden bg-[var(--color-background)]">
        <svg
          ref={svgRef}
          className="size-full touch-none select-none"
          style={{ cursor: tool === "hand" ? "grab" : tool === "eraser" ? "cell" : "crosshair" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <marker id="lousa-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="context-stroke" />
            </marker>
          </defs>
          <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>
            {allEls.map((el) => (
              <ElementView key={el.id} el={el} />
            ))}
            {selBox && (
              <rect
                x={selBox.x - 4}
                y={selBox.y - 4}
                width={selBox.w + 8}
                height={selBox.h + 8}
                fill="none"
                stroke="var(--color-ring)"
                strokeWidth={1.5 / vp.scale}
                strokeDasharray={`${6 / vp.scale} ${4 / vp.scale}`}
              />
            )}
          </g>
        </svg>

        {/* editor de texto/equação flutuante */}
        {editing && editEl && (
          <EditOverlay
            el={editEl}
            vp={vp}
            kind={editing.kind}
            onChange={(patch) => patchElement(editing.id, patch)}
            onDone={finishEditing}
          />
        )}

        {/* zoom */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow">
          <button type="button" aria-label="Mais zoom" onClick={() => zoomBy(1.2)} className="rounded p-1.5 hover:bg-[var(--color-accent)]">
            <ZoomIn className="size-4" />
          </button>
          <button type="button" aria-label="Menos zoom" onClick={() => zoomBy(1 / 1.2)} className="rounded p-1.5 hover:bg-[var(--color-accent)]">
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Resetar zoom"
            onClick={() => setVp({ x: 0, y: 0, scale: 1 })}
            className="rounded px-1 py-0.5 text-[10px] tabular-nums hover:bg-[var(--color-accent)]"
          >
            {Math.round(vp.scale * 100)}%
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>
    </div>
  );
}

// ── renderização de um elemento (em coords de mundo) ─────────────────────────
function ElementView({ el }: { el: LousaElement }) {
  switch (el.t) {
    case "stroke":
      return (
        <path d={strokePath(el.pts)} fill="none" stroke={el.color} strokeWidth={el.w} strokeLinecap="round" strokeLinejoin="round" />
      );
    case "line":
      return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color} strokeWidth={el.w} strokeLinecap="round" />;
    case "arrow":
      return (
        <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color} strokeWidth={el.w} strokeLinecap="round" markerEnd="url(#lousa-arrow)" />
      );
    case "rect":
      return (
        <rect
          x={Math.min(el.x1, el.x2)}
          y={Math.min(el.y1, el.y2)}
          width={Math.abs(el.x2 - el.x1)}
          height={Math.abs(el.y2 - el.y1)}
          rx={3}
          fill="none"
          stroke={el.color}
          strokeWidth={el.w}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={(el.x1 + el.x2) / 2}
          cy={(el.y1 + el.y2) / 2}
          rx={Math.abs(el.x2 - el.x1) / 2}
          ry={Math.abs(el.y2 - el.y1) / 2}
          fill="none"
          stroke={el.color}
          strokeWidth={el.w}
        />
      );
    case "text":
      return (
        <text x={el.x} y={el.y} fill={el.color} fontSize={el.size} style={{ whiteSpace: "pre" }}>
          {el.text.split("\n").map((line, i) => (
            <tspan key={i} x={el.x} dy={i === 0 ? 0 : el.size * 1.2}>
              {line || " "}
            </tspan>
          ))}
        </text>
      );
    case "math": {
      const b = bboxOf(el);
      return (
        <foreignObject x={el.x} y={el.y - el.size} width={Math.max(40, b.w)} height={Math.max(el.size * 1.8, b.h)} style={{ overflow: "visible" }}>
          <div
            style={{ fontSize: el.size, color: "var(--color-foreground)", pointerEvents: "none", whiteSpace: "nowrap" }}
            dangerouslySetInnerHTML={{ __html: katexHtml(el.latex) }}
          />
        </foreignObject>
      );
    }
    case "image":
      return <image href={el.src} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="none" />;
  }
}

// ── overlay de edição de texto / equação ─────────────────────────────────────
function EditOverlay({
  el,
  vp,
  kind,
  onChange,
  onDone,
}: {
  el: LousaElement;
  vp: VP;
  kind: "text" | "math";
  onChange: (patch: { text?: string; latex?: string }) => void;
  onDone: () => void;
}) {
  const x = (el.t === "text" || el.t === "math" ? el.x : 0) * vp.scale + vp.x;
  const y = (el.t === "text" || el.t === "math" ? el.y : 0) * vp.scale + vp.y;
  const size = (el.t === "text" || el.t === "math" ? el.size : 24) * vp.scale;
  const value = el.t === "text" ? el.text : el.t === "math" ? el.latex : "";

  return (
    <div className="absolute z-10" style={{ left: x, top: y - size }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(kind === "text" ? { text: e.target.value } : { latex: e.target.value })}
        onBlur={onDone}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            onDone();
          }
        }}
        placeholder={kind === "math" ? "ex: \\frac{a}{b}" : "Digite…"}
        className="rounded border border-[var(--color-ring)] bg-[var(--color-card)] px-1 font-mono outline-none"
        style={{ fontSize: Math.max(12, size), minWidth: 120 }}
      />
      {kind === "math" && value.trim() && (
        <div
          className="mt-1 rounded border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1"
          dangerouslySetInnerHTML={{ __html: katexHtml(value) }}
        />
      )}
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  active,
  onClick,
  label,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] disabled:opacity-30",
        active && "bg-[var(--color-accent)] text-[var(--color-foreground)]"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />;
}
