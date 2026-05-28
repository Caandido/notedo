"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Check,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Pencil,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateSummary } from "@/features/summaries/actions";

interface SummaryEditorProps {
  summaryId: string;
  initialTitle: string;
  initialContent: unknown;
}

const AUTOSAVE_DELAY_MS = 1200;

export function SummaryEditor({
  summaryId,
  initialTitle,
  initialContent,
}: SummaryEditorProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialTitle);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [savingTitle, setSavingTitle] = React.useState(false);
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = React.useRef<unknown>(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Comece a escrever seu resumo...",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "underline underline-offset-2",
        },
      }),
    ],
    content: (initialContent as object) ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-tiptap min-h-[400px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("idle");
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        const json = editor.getJSON();
        const result = await updateSummary({ id: summaryId, content: json });
        if (result.ok) {
          lastSavedContent.current = json;
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

  async function saveTitle() {
    if (!title.trim()) return setTitleError("Título obrigatório.");
    if (title.trim() === initialTitle) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    setTitleError(null);
    const result = await updateSummary({ id: summaryId, title });
    setSavingTitle(false);
    if (result.ok) {
      setEditingTitle(false);
      router.refresh();
    } else {
      setTitleError(result.error);
    }
  }

  function cancelTitle() {
    setEditingTitle(false);
    setTitle(initialTitle);
    setTitleError(null);
  }

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

  if (!editor) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <div className="space-y-1">
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") cancelTitle();
                }}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-2xl font-semibold outline-none transition-colors focus:border-[var(--color-ring)]"
              />
              {titleError && (
                <p className="text-xs text-rose-300">{titleError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveTitle}
                  disabled={savingTitle}
                  className="gap-1.5"
                >
                  {savingTitle ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelTitle}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingTitle(true)}
                aria-label="Editar título"
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Salvando
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-emerald-300">Salvo</span>
          )}
          {saveStatus === "error" && (
            <span className="text-rose-300">Erro ao salvar</span>
          )}
        </div>
      </div>

      <div className="sticky top-14 z-10 -mx-1 flex flex-wrap items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/95 p-1 backdrop-blur-md">
        <ToolbarButton
          icon={Heading1}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria="Título 1"
        />
        <ToolbarButton
          icon={Heading2}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria="Título 2"
        />
        <ToolbarButton
          icon={Heading3}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria="Título 3"
        />
        <Divider />
        <ToolbarButton
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria="Negrito"
        />
        <ToolbarButton
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria="Itálico"
        />
        <ToolbarButton
          icon={Strikethrough}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria="Tachado"
        />
        <ToolbarButton
          icon={Code2}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria="Código inline"
        />
        <Divider />
        <ToolbarButton
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria="Lista"
        />
        <ToolbarButton
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria="Lista numerada"
        />
        <ToolbarButton
          icon={Quote}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria="Citação"
        />
        <ToolbarButton
          icon={LinkIcon}
          active={editor.isActive("link")}
          onClick={addLink}
          aria="Link"
        />
        <Divider />
        <ToolbarButton
          icon={Undo2}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria="Desfazer"
        />
        <ToolbarButton
          icon={Redo2}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria="Refazer"
        />
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
  aria: string;
  disabled?: boolean;
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
      <Icon className="size-3.5" />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />;
}
