"use client";

import * as React from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
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
  Check,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Sigma,
  Strikethrough,
  Table as TableIcon,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { fileToDownscaledDataUrl } from "@/lib/image";
import { InlineMath, BlockMath } from "@/components/editor/math-node";

const AUTOSAVE_DELAY_MS = 1200;

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface RichEditorProps {
  initialContent: unknown;
  onSave: (content: unknown) => Promise<{ ok: boolean; error?: string }>;
  placeholder?: string;
  /**
   * Classe de offset da barra sticky. Padrão "top-14" (páginas com header fixo
   * de 56px acima, ex.: matérias/atividades). Telas onde o editor rola num
   * container próprio sem esse header (ex.: bloco de notas) passam "top-0".
   */
  stickyTopClass?: string;
}

export function RichEditor({
  initialContent,
  onSave,
  placeholder = "Comece a escrever...",
  stickyTopClass = "top-14",
}: RichEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit v3 já traz o Link embutido; desligamos aqui pra não duplicar
        // a extensão (nome "link" repetido gera warning e conflito de keymap) e
        // usamos a nossa configuração explícita abaixo.
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "underline underline-offset-2" },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-md border border-[var(--color-border)] my-2",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "tiptap-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
      InlineMath,
      BlockMath,
    ],
    content: (initialContent as object) ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-tiptap min-h-[400px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("idle");
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        const json = editor.getJSON();
        const result = await onSave(json);
        if (result.ok) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        } else {
          setSaveStatus("error");
        }
      }, AUTOSAVE_DELAY_MS);
    },
  });

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function addLink() {
    if (!editor) return;
    const url = prompt("URL do link:");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  // Abre o seletor de arquivo do SO. Sem prompt() de URL — que não funciona no
  // webview do EXE (Tauri/WebView2), mesma causa do bug das equações.
  function addImage() {
    fileRef.current?.click();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar a mesma imagem depois
    if (!file || !editor) return;
    const { src } = await fileToDownscaledDataUrl(file);
    editor.chain().focus().setImage({ src }).run();
  }

  function addTable() {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function addMath(block: boolean) {
    if (!editor) return;
    // Insere um nó de equação VAZIO que já abre em edição (input com preview ao
    // vivo). Sem prompt() — que não funciona no webview do EXE (Tauri/WebView2).
    editor
      .chain()
      .focus()
      .insertContent({ type: block ? "blockMath" : "inlineMath", attrs: { latex: "" } })
      .run();
  }

  if (!editor) return null;

  return (
    <>
      <RichEditorInner editor={editor} saveStatus={saveStatus} addLink={addLink} addImage={addImage} addTable={addTable} addMath={addMath} stickyTopClass={stickyTopClass} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
    </>
  );
}

/**
 * Toolbar + conteúdo. Separado pra usar useEditorState: no TipTap v3 o useEditor
 * NÃO re-renderiza a cada transação, então `editor.isActive(...)` lido direto no
 * render ficava congelado (os botões nunca acendiam — parecia que "não
 * funcionava"). useEditorState assina as mudanças e devolve um snapshot reativo.
 */
function RichEditorInner({
  editor,
  saveStatus,
  addLink,
  addImage,
  addTable,
  addMath,
  stickyTopClass,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  saveStatus: SaveStatus;
  addLink: () => void;
  addImage: () => void;
  addTable: () => void;
  addMath: (block: boolean) => void;
  stickyTopClass: string;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  return (
    <div className="space-y-3">
      <div className={cn("sticky z-10 -mx-1 flex flex-wrap items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/95 p-1 backdrop-blur-md", stickyTopClass)}>
        <ToolbarButton
          icon={Heading1}
          active={state.h1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria="Título 1"
        />
        <ToolbarButton
          icon={Heading2}
          active={state.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria="Título 2"
        />
        <ToolbarButton
          icon={Heading3}
          active={state.h3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria="Título 3"
        />
        <Divider />
        <ToolbarButton
          icon={Bold}
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria="Negrito"
        />
        <ToolbarButton
          icon={Italic}
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria="Itálico"
        />
        <ToolbarButton
          icon={Strikethrough}
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria="Tachado"
        />
        <ToolbarButton
          icon={Code2}
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria="Código inline"
        />
        <Divider />
        <ToolbarButton
          icon={List}
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria="Lista"
        />
        <ToolbarButton
          icon={ListOrdered}
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria="Lista numerada"
        />
        <ToolbarButton
          icon={Quote}
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria="Citação"
        />
        <ToolbarButton
          icon={LinkIcon}
          active={state.link}
          onClick={addLink}
          aria="Link"
        />
        <Divider />
        <ToolbarButton icon={ImageIcon} onClick={addImage} aria="Inserir imagem" />
        <ToolbarButton icon={TableIcon} onClick={addTable} aria="Tabela 3×3" />
        <ToolbarButton
          icon={Sigma}
          onClick={() => addMath(false)}
          aria="Equação inline ($)"
        />
        <ToolbarButton
          icon={Sigma}
          onClick={() => addMath(true)}
          aria="Equação em bloco ($$)"
          className="rotate-12"
        />
        <Divider />
        <ToolbarButton
          icon={Undo2}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
          aria="Desfazer"
        />
        <ToolbarButton
          icon={Redo2}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
          aria="Refazer"
        />
        <div className="ml-auto pr-1 text-xs text-[var(--color-muted-foreground)]">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Salvando
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Check className="size-3" />
              Salvo
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-rose-300">Erro ao salvar</span>
          )}
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
  aria,
  disabled,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
  aria: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      aria-pressed={active}
      title={aria}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] disabled:opacity-30 disabled:pointer-events-none",
        active && "bg-[var(--color-accent)] text-[var(--color-foreground)]"
      )}
    >
      <Icon className={cn("size-3.5", className)} />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />;
}
