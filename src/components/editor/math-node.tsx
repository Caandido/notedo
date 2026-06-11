"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import katex from "katex";
import * as React from "react";

/** Renderiza LaTeX em HTML via KaTeX, tolerante a erro. */
function renderKatex(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex || (display ? "" : "?"), {
      throwOnError: false,
      displayMode: display,
    });
  } catch {
    return `<span class="text-rose-400">LaTeX inválido</span>`;
  }
}

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

function InlineMathView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  // Nó recém-inserido (latex vazio) já abre em edição — sem depender de prompt().
  const [editing, setEditing] = React.useState(!node.attrs.latex);
  const [draft, setDraft] = React.useState(node.attrs.latex as string);

  const rendered = React.useMemo(
    () => renderKatex(node.attrs.latex as string, false),
    [node.attrs.latex]
  );

  function save() {
    const v = draft.trim();
    if (!v) {
      deleteNode(); // equação abandonada vazia: remove em vez de deixar "?"
      return;
    }
    updateAttributes({ latex: v });
    setEditing(false);
  }

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="inline-flex items-center gap-1.5">
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
          style={{ minWidth: 120 }}
          placeholder="ex: \frac{a}{b}"
        />
        {draft.trim() && (
          <span
            className="align-middle text-sm"
            dangerouslySetInnerHTML={{ __html: renderKatex(draft, false) }}
          />
        )}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-block cursor-pointer rounded px-0.5 align-middle hover:bg-[var(--color-accent)]/40 ${selected ? "bg-[var(--color-accent)]" : ""}`}
      onClick={() => {
        setDraft(node.attrs.latex as string);
        setEditing(true);
      }}
      contentEditable={false}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function BlockMathView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [editing, setEditing] = React.useState(!node.attrs.latex);
  const [draft, setDraft] = React.useState(node.attrs.latex as string);

  const rendered = React.useMemo(
    () => renderKatex(node.attrs.latex as string, true),
    [node.attrs.latex]
  );

  function save() {
    const v = draft.trim();
    if (!v) {
      deleteNode();
      return;
    }
    updateAttributes({ latex: v });
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
            if (e.key === "Escape") {
              e.preventDefault();
              save();
            }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              save();
            }
          }}
          rows={3}
          className="w-full resize-y rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2 font-mono text-sm outline-none"
          placeholder="ex: \int_0^1 x^2\,dx"
        />
        {draft.trim() && (
          <div
            className="mt-2 overflow-x-auto border-t border-[var(--color-border)] pt-2 text-center"
            dangerouslySetInnerHTML={{ __html: renderKatex(draft, true) }}
          />
        )}
        <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
          Esc ou Ctrl+Enter para salvar
        </p>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className={`my-3 cursor-pointer overflow-x-auto rounded-md p-3 text-center hover:bg-[var(--color-accent)]/40 ${selected ? "bg-[var(--color-accent)]" : ""}`}
      onClick={() => {
        setDraft(node.attrs.latex as string);
        setEditing(true);
      }}
      contentEditable={false}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
