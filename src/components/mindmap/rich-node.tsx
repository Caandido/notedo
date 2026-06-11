"use client";

import * as React from "react";
import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Sigma,
  Table as TableIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { InlineMath, BlockMath } from "@/components/editor/math-node";
import { useMindMapCtx } from "./editor-context";

export type RichNodeData = { content?: unknown };

export function RichNode({ id, data, selected }: NodeProps) {
  const { updateNodeContent } = useMindMapCtx();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Escreva… (tabelas, fórmulas, links)" }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({
        inline: false,
        HTMLAttributes: { class: "rounded-md border border-[var(--color-border)] my-1" },
      }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      InlineMath,
      BlockMath,
    ],
    content: ((data as RichNodeData).content as object) ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-tiptap text-sm focus:outline-none" },
    },
    onUpdate: ({ editor }) => updateNodeContent(id, editor.getJSON()),
  });

  function addLink() {
    if (!editor) return;
    const url = prompt("URL do link:");
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }
  function addImage() {
    if (!editor) return;
    const url = prompt("URL da imagem (https://...):");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }
  function addTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }
  function addMath() {
    if (!editor) return;
    // Nó de equação vazio que abre em edição (sem prompt — quebra no EXE).
    editor.chain().focus().insertContent({ type: "blockMath", attrs: { latex: "" } }).run();
  }

  return (
    <div
      className={cn(
        "size-full overflow-hidden rounded-lg border bg-[var(--color-card)] shadow-sm",
        selected ? "border-[var(--color-ring)]" : "border-[var(--color-border)]"
      )}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={120}
        lineClassName="!border-[var(--color-ring)]"
        handleClassName="!size-2 !rounded-sm !bg-[var(--color-ring)]"
      />
      <Handle type="target" position={Position.Top} className="!size-2" />

      {editor && (
        <NodeToolbar isVisible={selected} position={Position.Top}>
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-0.5 shadow-md">
            <TBtn icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} aria="Título" />
            <TBtn icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} aria="Negrito" />
            <TBtn icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} aria="Itálico" />
            <TBtn icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} aria="Lista" />
            <TBtn icon={LinkIcon} onClick={addLink} active={editor.isActive("link")} aria="Link" />
            <TBtn icon={ImageIcon} onClick={addImage} aria="Imagem (URL)" />
            <TBtn icon={TableIcon} onClick={addTable} aria="Tabela" />
            <TBtn icon={Sigma} onClick={addMath} aria="Equação" />
          </div>
        </NodeToolbar>
      )}

      <div className="nodrag nowheel size-full overflow-auto p-2.5">
        <EditorContent editor={editor} />
      </div>

      <Handle type="source" position={Position.Bottom} className="!size-2" />
    </div>
  );
}

function TBtn({
  icon: Icon,
  onClick,
  active,
  aria,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  aria: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      title={aria}
      aria-pressed={active}
      className={cn(
        "flex size-7 items-center justify-center rounded text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
        active && "bg-[var(--color-accent)] text-[var(--color-foreground)]"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
