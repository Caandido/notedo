"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NewTopicForm } from "@/components/subjects/new-topic-form";
import { deleteTopic } from "@/features/topics/actions";
import { cn } from "@/lib/utils";
import type { TopicNode } from "@/lib/queries";

interface TopicTreeProps {
  subjectId: string;
  topics: TopicNode[];
}

export function TopicTree({ subjectId, topics }: TopicTreeProps) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Sem tópicos ainda. Crie o primeiro acima.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {topics.map((t) => (
        <TopicItem key={t.id} subjectId={subjectId} topic={t} depth={0} />
      ))}
    </ul>
  );
}

interface TopicItemProps {
  subjectId: string;
  topic: TopicNode;
  depth: number;
}

function TopicItem({ subjectId, topic, depth }: TopicItemProps) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  const hasChildren = topic.children.length > 0;

  async function onDelete() {
    if (
      !confirm(
        `Deletar "${topic.title}"${hasChildren ? " e seus subtópicos" : ""}?`
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
    <li>
      <div
        className="group flex items-center gap-2 rounded-md py-1.5 pr-1 hover:bg-[var(--color-accent)]/40"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label={expanded ? "Recolher" : "Expandir"}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate text-sm">{topic.title}</span>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <NewTopicForm
            subjectId={subjectId}
            parentId={topic.id}
            variant="inline"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Deletar"
            className="size-7"
          >
            {deleting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Trash2 className="size-3" />
            )}
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-1">
          {topic.children.map((c) => (
            <TopicItem
              key={c.id}
              subjectId={subjectId}
              topic={c}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
