"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewTopicForm } from "@/components/subjects/new-topic-form";
import { deleteTopic } from "@/features/topics/actions";
import { cn } from "@/lib/utils";
import type { TopicNode } from "@/lib/queries";

interface TopicTreeProps {
  subjectId: string;
  subjectColor: string;
  topics: TopicNode[];
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d atrás`;
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function TopicTree({
  subjectId,
  subjectColor,
  topics,
}: TopicTreeProps) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Sem tópicos ainda. Crie o primeiro acima.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {topics.map((t) => (
        <TopicCard
          key={t.id}
          subjectId={subjectId}
          subjectColor={subjectColor}
          topic={t}
          depth={0}
        />
      ))}
    </ul>
  );
}

interface TopicCardProps {
  subjectId: string;
  subjectColor: string;
  topic: TopicNode;
  depth: number;
}

function TopicCard({ subjectId, subjectColor, topic, depth }: TopicCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(depth === 0);
  const [adding, setAdding] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const hasChildren = topic.children.length > 0;

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Deletar "${topic.title}"${hasChildren ? ` e seus ${topic.descendantCount} subtópicos` : ""}?`
      )
    )
      return;
    setDeleting(true);
    const result = await deleteTopic(topic.id);
    setDeleting(false);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <li style={{ marginLeft: `${depth * 18}px` }}>
      <div className="group relative flex items-stretch overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] transition-shadow hover:shadow-md">
        <span
          className="w-1 shrink-0"
          style={{ backgroundColor: subjectColor }}
        />

        <Link
          href={`/topics/${topic.id}`}
          className="flex flex-1 items-center gap-3 px-3 py-3"
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label={expanded ? "Recolher" : "Expandir"}
            >
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            </button>
          ) : (
            <span className="size-4 shrink-0" />
          )}

          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundColor: `${subjectColor}1f`,
              border: `1px solid ${subjectColor}40`,
            }}
          >
            <Layers className="size-3.5" style={{ color: subjectColor }} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-medium">{topic.title}</h3>
              {topic.hasContent && (
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--color-chart-2)]/15 px-1.5 py-0.5 text-[9px] text-[var(--color-chart-2)]"
                  aria-label="Tem conteúdo"
                >
                  <FileText className="size-2.5" />
                  conteúdo
                </span>
              )}
              {hasChildren && (
                <span className="inline-flex items-center gap-0.5 rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[9px] text-[var(--color-muted-foreground)]">
                  {topic.descendantCount}{" "}
                  {topic.descendantCount === 1 ? "subtópico" : "subtópicos"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--color-muted-foreground)]">
              atualizado {relativeTime(topic.updatedAt)}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAdding((v) => !v)}
            aria-label="Adicionar subtópico"
            className="size-7"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Deletar"
            className="size-7"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {adding && (
        <div
          className="mt-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2"
          style={{ marginLeft: "18px" }}
        >
          <NewTopicForm
            subjectId={subjectId}
            parentId={topic.id}
            label="Criar subtópico"
          />
        </div>
      )}

      {hasChildren && expanded && (
        <ul className="mt-2 space-y-2">
          {topic.children.map((c) => (
            <TopicCard
              key={c.id}
              subjectId={subjectId}
              subjectColor={subjectColor}
              topic={c}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
