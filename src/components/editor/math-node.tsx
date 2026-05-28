"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import katex from "katex";
import * as React from "react";

export const InlineMath = Node.create({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs) => ({ "data-latex": attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-type='inline-math']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "inline-math" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView);
  },
});

export const BlockMath = Node.create({
  name: "blockMath",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs) => ({ "data-latex": attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='block-math']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "block-math" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockMathView);
  },
});

function InlineMathView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(node.attrs.latex as string);

  const rendered = React.useMemo(() => {
    try {
      return katex.renderToString(node.attrs.latex || "?", {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span class="text-rose-400">LaTeX inválido</span>`;
    }
  }, [node.attrs.latex]);

  function save() {
    updateAttributes({ latex: draft });
    setEditing(false);
  }

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="inline-flex items-center gap-1">
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.preventDefault();
              save();
            }
          }}
          className="rounded border border-[var(--color-ring)] bg-[var(--color-card)] px-1 py-0 font-mono text-sm outline-none"
          style={{ minWidth: 100 }}
          placeholder="\\frac{a}{b}"
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-block cursor-pointer rounded px-0.5 align-middle hover:bg-[var(--color-accent)]/40 ${selected ? "bg-[var(--color-accent)]" : ""}`}
      onClick={() => setEditing(true)}
      contentEditable={false}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function BlockMathView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(node.attrs.latex as string);

  const rendered = React.useMemo(() => {
    try {
      return katex.renderToString(node.attrs.latex || "", {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `<span class="text-rose-400">LaTeX inválido</span>`;
    }
  }, [node.attrs.latex]);

  function save() {
    updateAttributes({ latex: draft });
    setEditing(false);
  }

  if (editing) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-3 rounded-md border border-[var(--color-ring)] bg-[var(--color-card)] p-3"
      >
        <textarea
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Escape") save();
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
          }}
          rows={3}
          className="w-full resize-y rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2 font-mono text-sm outline-none"
          placeholder="\\int_0^1 x^2 dx"
        />
        <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
          Esc ou Ctrl+Enter para salvar
        </p>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`my-3 cursor-pointer rounded-md p-3 text-center hover:bg-[var(--color-accent)]/40 ${selected ? "bg-[var(--color-accent)]" : ""}`}
      onClick={() => setEditing(true)}
      contentEditable={false}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
