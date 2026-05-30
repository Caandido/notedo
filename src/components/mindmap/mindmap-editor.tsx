"use client";

import "@xyflow/react/dist/style.css";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { cuid } from "@/lib/db";
import { getMindMap } from "@/lib/queries";
import {
  importSlidesIntoMap,
  renameMindMap,
  saveMindMapData,
} from "@/features/mindmaps/actions";
import type { MindMapData, MindMapNode, MindMapShape } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { MindMapCtx } from "./editor-context";
import { TextNode } from "./text-node";
import { SlideNode } from "./slide-node";
import { RichNode } from "./rich-node";
import { StickyNode } from "./sticky-node";
import { ShapeNode } from "./shape-node";
import { FrameNode } from "./frame-node";
import { DrawNode } from "./draw-node";
import { ImportDialog } from "./import-dialog";
import { MindMapToolbar, type ToolId } from "./toolbar";
import { DrawOverlay, type CommittedStroke } from "./draw-overlay";
import { AlignPanel, EdgePanel, type EdgePatch } from "./panels";

const nodeTypes: NodeTypes = {
  text: TextNode,
  slide: SlideNode,
  rich: RichNode,
  sticky: StickyNode,
  shape: ShapeNode,
  frame: FrameNode,
  draw: DrawNode,
};

const DEFAULT_EDGE_COLOR = "#94a3b8";

function rfEdgeProps(variant: string, color: string, arrow: boolean) {
  return {
    type: variant === "straight" ? "straight" : variant === "smoothstep" ? "smoothstep" : "default",
    markerEnd: arrow ? { type: MarkerType.ArrowClosed, color, width: 18, height: 18 } : undefined,
    style: { stroke: color, strokeWidth: 2 },
  };
}

function toRFEdges(data: MindMapData): Edge[] {
  return data.edges.map((e) => {
    const variant = e.variant ?? "default";
    const color = e.color ?? DEFAULT_EDGE_COLOR;
    const arrow = e.arrow !== false;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      data: { variant, color, arrow },
      ...rfEdgeProps(variant, color, arrow),
    };
  });
}

function toRFNodes(data: MindMapData): Node[] {
  return data.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: { x: n.x, y: n.y },
    zIndex: n.kind === "frame" ? 0 : 1,
    data:
      n.kind === "slide"
        ? { slide: n.slide ?? null }
        : n.kind === "rich"
          ? { content: n.content ?? null }
          : n.kind === "shape"
            ? { text: n.text ?? "", color: n.color ?? null, stroke: n.stroke ?? null, shape: n.shape ?? "rect" }
            : n.kind === "draw"
              ? { draw: n.draw ?? null }
              : { text: n.text ?? "", color: n.color ?? null },
    style: n.width ? { width: n.width, height: n.height } : undefined,
  }));
}

function serialize(nodes: Node[], edges: Edge[]): MindMapData {
  return {
    nodes: nodes.map((n) => {
      const w = n.style?.width;
      const h = n.style?.height;
      const kind = (n.type as MindMapNode["kind"]) ?? "text";
      const node: MindMapNode = {
        id: n.id,
        kind,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        width: typeof w === "number" ? w : undefined,
        height: typeof h === "number" ? h : undefined,
      };
      const d = n.data as Record<string, unknown>;
      if (kind === "slide") {
        node.slide = (d.slide as MindMapNode["slide"]) ?? null;
      } else if (kind === "rich") {
        node.content = d.content ?? null;
      } else if (kind === "draw") {
        node.draw = (d.draw as MindMapNode["draw"]) ?? null;
      } else if (kind === "shape") {
        node.text = (d.text as string) ?? "";
        node.color = (d.color as string | null) ?? null;
        node.stroke = (d.stroke as string | null) ?? null;
        node.shape = (d.shape as MindMapShape) ?? "rect";
      } else {
        node.text = (d.text as string) ?? "";
        node.color = (d.color as string | null) ?? null;
      }
      return node;
    }),
    edges: edges.map((e) => {
      const ed = e.data as { variant?: string; color?: string | null; arrow?: boolean } | undefined;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        variant: (ed?.variant as MindMapData["edges"][number]["variant"]) ?? "default",
        color: ed?.color ?? DEFAULT_EDGE_COLOR,
        arrow: ed?.arrow !== false,
        label: typeof e.label === "string" ? e.label : undefined,
      };
    }),
  };
}

const PLACEABLE: ToolId[] = ["sticky", "rect", "ellipse", "diamond", "text", "rich", "frame"];

function Flow({ id }: { id: string }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [tool, setTool] = React.useState<ToolId>("select");
  const [penColor, setPenColor] = React.useState("#f43f5e");
  const [penWidth, setPenWidth] = React.useState(4);
  const dirty = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    void getMindMap(id).then((m) => {
      if (!active) return;
      if (!m) {
        setMissing(true);
        setLoaded(true);
        return;
      }
      setTitle(m.title);
      setNodes(toRFNodes(m.data));
      setEdges(toRFEdges(m.data));
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id, setNodes, setEdges]);

  // autosave (debounced)
  React.useEffect(() => {
    if (!loaded || !dirty.current) return;
    const t = setTimeout(() => {
      dirty.current = false;
      void saveMindMapData(id, serialize(nodes, edges));
    }, 800);
    return () => clearTimeout(t);
  }, [nodes, edges, loaded, id]);

  const handleNodesChange = React.useCallback<OnNodesChange>(
    (c) => {
      dirty.current = true;
      onNodesChange(c);
    },
    [onNodesChange]
  );
  const handleEdgesChange = React.useCallback<OnEdgesChange>(
    (c) => {
      dirty.current = true;
      onEdgesChange(c);
    },
    [onEdgesChange]
  );
  const onConnect = React.useCallback(
    (c: Connection) => {
      dirty.current = true;
      setEdges((eds) =>
        addEdge(
          {
            ...c,
            id: cuid(),
            data: { variant: "default", color: DEFAULT_EDGE_COLOR, arrow: true },
            ...rfEdgeProps("default", DEFAULT_EDGE_COLOR, true),
          },
          eds
        )
      );
    },
    [setEdges]
  );

  /* ---------- mutações de nó (via contexto) ---------- */
  const updateNodeText = React.useCallback(
    (nodeId: string, text: string) => {
      dirty.current = true;
      setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text } } : n)));
    },
    [setNodes]
  );
  const updateNodeColor = React.useCallback(
    (nodeId: string, color: string | null) => {
      dirty.current = true;
      setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, color } } : n)));
    },
    [setNodes]
  );
  const updateNodeContent = React.useCallback(
    (nodeId: string, content: unknown) => {
      dirty.current = true;
      setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, content } } : n)));
    },
    [setNodes]
  );
  const patchNodeData = React.useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      dirty.current = true;
      setNodes((ns) => ns.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)));
    },
    [setNodes]
  );
  const deleteNode = React.useCallback(
    (nodeId: string) => {
      dirty.current = true;
      setNodes((ns) => ns.filter((n) => n.id !== nodeId));
      setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  /* ---------- criação por clique no canvas ---------- */
  const placeNode = React.useCallback(
    (flowX: number, flowY: number, t: ToolId) => {
      const nid = cuid();
      const base = { id: nid, position: { x: 0, y: 0 }, selected: true as const, zIndex: 1 };
      let node: Node | null = null;
      const center = (w: number, h: number) => ({ x: flowX - w / 2, y: flowY - h / 2 });
      if (t === "sticky") {
        node = { ...base, type: "sticky", position: center(170, 130), data: { text: "", color: "#fde68a" }, style: { width: 170, height: 130 } };
      } else if (t === "rect" || t === "ellipse" || t === "diamond") {
        node = { ...base, type: "shape", position: center(170, 110), data: { text: "", color: "#bfdbfe", stroke: null, shape: t }, style: { width: 170, height: 110 } };
      } else if (t === "text") {
        node = { ...base, type: "text", position: center(200, 44), data: { text: "", color: null }, style: { width: 200 } };
      } else if (t === "rich") {
        node = { ...base, type: "rich", position: center(300, 180), data: { content: null }, style: { width: 300, height: 180 } };
      } else if (t === "frame") {
        node = { ...base, type: "frame", zIndex: 0, position: center(380, 260), data: { text: "Seção", color: "#a78bfa" }, style: { width: 380, height: 260 } };
      }
      if (!node) return;
      dirty.current = true;
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), node!]);
    },
    [setNodes]
  );

  const onPaneClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!PLACEABLE.includes(tool)) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      placeNode(p.x, p.y, tool);
    },
    [tool, screenToFlowPosition, placeNode]
  );

  const commitStroke = React.useCallback(
    (s: CommittedStroke) => {
      dirty.current = true;
      const nid = cuid();
      setNodes((ns) => [
        ...ns,
        {
          id: nid,
          type: "draw",
          position: { x: s.x, y: s.y },
          zIndex: 1,
          data: { draw: { d: s.d, stroke: s.stroke, width: s.strokeWidth, w: s.width, h: s.height } },
          style: { width: s.width, height: s.height },
        },
      ]);
    },
    [setNodes]
  );

  /* ---------- estilo das arestas ---------- */
  const patchEdge = React.useCallback(
    (edgeId: string, patch: EdgePatch) => {
      dirty.current = true;
      setEdges((es) =>
        es.map((e) => {
          if (e.id !== edgeId) return e;
          const cur = (e.data ?? {}) as { variant?: string; color?: string | null; arrow?: boolean };
          const variant = (patch.variant ?? cur.variant ?? "default") as string;
          const color = (patch.color ?? cur.color ?? DEFAULT_EDGE_COLOR) as string;
          const arrow = patch.arrow ?? cur.arrow ?? true;
          const label = patch.label !== undefined ? patch.label : (e.label as string | undefined);
          return {
            ...e,
            label: label || undefined,
            data: { variant, color, arrow },
            ...rfEdgeProps(variant, color, arrow),
          };
        })
      );
    },
    [setEdges]
  );

  /* ---------- alinhamento ---------- */
  const dimOf = (n: Node) => ({
    w: n.measured?.width ?? (typeof n.style?.width === "number" ? (n.style.width as number) : 160),
    h: n.measured?.height ?? (typeof n.style?.height === "number" ? (n.style.height as number) : 80),
  });

  const alignSelected = React.useCallback(
    (a: "left" | "center-h" | "right" | "top" | "middle-v" | "bottom") => {
      setNodes((ns) => {
        const sel = ns.filter((n) => n.selected);
        if (sel.length < 2) return ns;
        let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
        for (const n of sel) {
          const { w, h } = dimOf(n);
          minL = Math.min(minL, n.position.x);
          minT = Math.min(minT, n.position.y);
          maxR = Math.max(maxR, n.position.x + w);
          maxB = Math.max(maxB, n.position.y + h);
        }
        const cx = (minL + maxR) / 2;
        const cy = (minT + maxB) / 2;
        dirty.current = true;
        return ns.map((n) => {
          if (!n.selected) return n;
          const { w, h } = dimOf(n);
          let { x, y } = n.position;
          if (a === "left") x = minL;
          else if (a === "right") x = maxR - w;
          else if (a === "center-h") x = cx - w / 2;
          else if (a === "top") y = minT;
          else if (a === "bottom") y = maxB - h;
          else if (a === "middle-v") y = cy - h / 2;
          return { ...n, position: { x, y } };
        });
      });
    },
    [setNodes]
  );

  const distributeSelected = React.useCallback(
    (axis: "h" | "v") => {
      setNodes((ns) => {
        const sel = ns.filter((n) => n.selected);
        if (sel.length < 3) return ns;
        const withCenter = sel.map((n) => {
          const { w, h } = dimOf(n);
          return { id: n.id, c: axis === "h" ? n.position.x + w / 2 : n.position.y + h / 2, w, h };
        });
        withCenter.sort((p, q) => p.c - q.c);
        const first = withCenter[0].c;
        const last = withCenter[withCenter.length - 1].c;
        const step = (last - first) / (withCenter.length - 1);
        const target = new Map(withCenter.map((p, i) => [p.id, first + step * i]));
        dirty.current = true;
        return ns.map((n) => {
          const t = target.get(n.id);
          if (t === undefined) return n;
          const { w, h } = dimOf(n);
          return axis === "h"
            ? { ...n, position: { ...n.position, x: t - w / 2 } }
            : { ...n, position: { ...n.position, y: t - h / 2 } };
        });
      });
    },
    [setNodes]
  );

  const flush = React.useCallback(async () => {
    dirty.current = false;
    await saveMindMapData(id, serialize(nodes, edges));
  }, [id, nodes, edges]);

  const reloadFromDb = React.useCallback(async () => {
    const m = await getMindMap(id);
    if (!m) return;
    setNodes(toRFNodes(m.data));
    setEdges(toRFEdges(m.data));
  }, [id, setNodes, setEdges]);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const onPickImage = React.useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      await flush();
      await importSlidesIntoMap(id, Array.from(files));
      await reloadFromDb();
    },
    [flush, id, reloadFromDb]
  );

  /* ---------- atalhos de teclado ---------- */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, ToolId> = { v: "select", n: "sticky", s: "rect", t: "text", r: "rich", f: "frame", d: "draw" };
      const k = e.key.toLowerCase();
      if (k === "escape") setTool("select");
      else if (map[k]) setTool(map[k]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = React.useMemo(
    () => ({ updateNodeText, updateNodeColor, updateNodeContent, patchNodeData, deleteNode }),
    [updateNodeText, updateNodeColor, updateNodeContent, patchNodeData, deleteNode]
  );

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);
  const showAlign = selectedNodes.length >= 2;
  const singleEdge = !showAlign && selectedNodes.length === 0 && selectedEdges.length === 1 ? selectedEdges[0] : null;
  const drawing = tool === "draw";

  return (
    <MindMapCtx.Provider value={ctx}>
      <div className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-card)] px-3">
          <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => router.push("/mindmaps")}>
            <ArrowLeft className="size-4" />
          </Button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void renameMindMap(id, title)}
            maxLength={120}
            placeholder="Título do mapa"
            className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm font-medium outline-none focus:bg-[var(--color-background)]"
          />
          <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
            arraste das bolinhas pra conectar · Del apaga
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          {!loaded ? (
            <div className="flex size-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
            </div>
          ) : missing ? (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">Mapa não encontrado.</p>
              <Button variant="outline" size="sm" onClick={() => router.push("/mindmaps")}>
                Voltar
              </Button>
            </div>
          ) : (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onPaneClick={onPaneClick}
                colorMode={resolvedTheme === "dark" ? "dark" : "light"}
                fitView
                minZoom={0.1}
                elevateNodesOnSelect={false}
                panOnDrag={!drawing}
                nodesDraggable={!drawing}
                elementsSelectable={!drawing}
                selectionKeyCode={null}
                multiSelectionKeyCode={["Shift", "Meta", "Control"]}
                deleteKeyCode={["Backspace", "Delete"]}
                className={
                  PLACEABLE.includes(tool) ? "[&_.react-flow__pane]:cursor-crosshair" : undefined
                }
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} />
                <Controls />
                <MiniMap pannable zoomable />
              </ReactFlow>

              <MindMapToolbar
                tool={tool}
                setTool={setTool}
                onImage={() => imageInputRef.current?.click()}
                onImport={() => setImportOpen(true)}
                penColor={penColor}
                setPenColor={setPenColor}
                penWidth={penWidth}
                setPenWidth={setPenWidth}
              />

              {drawing && (
                <DrawOverlay penColor={penColor} penWidth={penWidth} onCommit={commitStroke} />
              )}

              {showAlign && (
                <AlignPanel onAlign={alignSelected} onDistribute={distributeSelected} />
              )}
              {singleEdge && (
                <EdgePanel
                  edge={singleEdge}
                  onChange={(patch) => patchEdge(singleEdge.id, patch)}
                  onDelete={() => {
                    dirty.current = true;
                    setEdges((es) => es.filter((e) => e.id !== singleEdge.id));
                  }}
                />
              )}
            </>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void onPickImage(e.target.files)}
          />
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        mapId={id}
        flush={flush}
        onClose={() => setImportOpen(false)}
        onImported={() => void reloadFromDb()}
      />
    </MindMapCtx.Provider>
  );
}

export function MindMapEditor({ id }: { id: string }) {
  return (
    <ReactFlowProvider>
      <Flow id={id} />
    </ReactFlowProvider>
  );
}
