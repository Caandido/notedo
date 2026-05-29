"use client";

import "@xyflow/react/dist/style.css";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { ArrowLeft, FileText, Image as ImageIcon, Loader2, Plus, Upload } from "lucide-react";

import { cuid } from "@/lib/db";
import { getMindMap } from "@/lib/queries";
import {
  importSlidesIntoMap,
  renameMindMap,
  saveMindMapData,
} from "@/features/mindmaps/actions";
import type { MindMapData, MindMapNode } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { MindMapCtx } from "./editor-context";
import { TextNode } from "./text-node";
import { SlideNode } from "./slide-node";
import { RichNode } from "./rich-node";
import { ImportDialog } from "./import-dialog";

const nodeTypes: NodeTypes = { text: TextNode, slide: SlideNode, rich: RichNode };

function toRFNodes(data: MindMapData): Node[] {
  return data.nodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: { x: n.x, y: n.y },
    data:
      n.kind === "slide"
        ? { slide: n.slide ?? null }
        : n.kind === "rich"
          ? { content: n.content ?? null }
          : { text: n.text ?? "", color: n.color ?? null },
    style: n.width ? { width: n.width, height: n.height } : undefined,
  }));
}

function serialize(nodes: Node[], edges: Edge[]): MindMapData {
  return {
    nodes: nodes.map((n) => {
      const w = n.style?.width;
      const h = n.style?.height;
      const node: MindMapNode = {
        id: n.id,
        kind: (n.type as "text" | "slide") ?? "text",
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        width: typeof w === "number" ? w : undefined,
        height: typeof h === "number" ? h : undefined,
      };
      if (node.kind === "slide") {
        node.slide = (n.data as { slide?: MindMapNode["slide"] }).slide ?? null;
      } else if (node.kind === "rich") {
        node.content = (n.data as { content?: unknown }).content ?? null;
      } else {
        const d = n.data as { text?: string; color?: string | null };
        node.text = d.text ?? "";
        node.color = d.color ?? null;
      }
      return node;
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

function Flow({ id }: { id: string }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [loaded, setLoaded] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [importOpen, setImportOpen] = React.useState(false);
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
      setEdges(
        m.data.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        }))
      );
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [id, setNodes, setEdges]);

  // autosave (debounced) — só quando houve mudança real, nunca no load.
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
      setEdges((eds) => addEdge({ ...c, id: cuid() }, eds));
    },
    [setEdges]
  );

  const updateNodeText = React.useCallback(
    (nodeId: string, text: string) => {
      dirty.current = true;
      setNodes((ns) =>
        ns.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, text } } : n
        )
      );
    },
    [setNodes]
  );
  const updateNodeColor = React.useCallback(
    (nodeId: string, color: string | null) => {
      dirty.current = true;
      setNodes((ns) =>
        ns.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, color } } : n
        )
      );
    },
    [setNodes]
  );

  const updateNodeContent = React.useCallback(
    (nodeId: string, content: unknown) => {
      dirty.current = true;
      setNodes((ns) =>
        ns.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, content } } : n
        )
      );
    },
    [setNodes]
  );

  const addText = React.useCallback(() => {
    dirty.current = true;
    const nid = cuid();
    setNodes((ns) => [
      ...ns,
      {
        id: nid,
        type: "text",
        position: { x: 120 + ns.length * 16, y: 120 + ns.length * 16 },
        data: { text: "", color: null },
        style: { width: 200 },
        selected: true,
      },
    ]);
  }, [setNodes]);

  const addRich = React.useCallback(() => {
    dirty.current = true;
    const nid = cuid();
    setNodes((ns) => [
      ...ns,
      {
        id: nid,
        type: "rich",
        position: { x: 160 + ns.length * 16, y: 160 + ns.length * 16 },
        data: { content: null },
        style: { width: 300, height: 180 },
        selected: true,
      },
    ]);
  }, [setNodes]);

  const flush = React.useCallback(async () => {
    dirty.current = false;
    await saveMindMapData(id, serialize(nodes, edges));
  }, [id, nodes, edges]);

  const reloadFromDb = React.useCallback(async () => {
    const m = await getMindMap(id);
    if (!m) return;
    setNodes(toRFNodes(m.data));
    setEdges(
      m.data.edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
    );
  }, [id, setNodes, setEdges]);

  // Upload de imagem solta -> reaproveita o pipeline de slides (1 arquivo).
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

  const ctx = React.useMemo(
    () => ({ updateNodeText, updateNodeColor, updateNodeContent }),
    [updateNodeText, updateNodeColor, updateNodeContent]
  );

  return (
    <MindMapCtx.Provider value={ctx}>
      <div className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-card)] px-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => router.push("/mindmaps")}
          >
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addText}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Texto</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addRich}>
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Nota</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="size-3.5" />
            <span className="hidden sm:inline">Imagem</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Importar slides</span>
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void onPickImage(e.target.files)}
          />
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
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              colorMode={resolvedTheme === "dark" ? "dark" : "light"}
              fitView
              minZoom={0.1}
              deleteKeyCode={["Backspace", "Delete"]}
            >
              <Background gap={20} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          )}
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
