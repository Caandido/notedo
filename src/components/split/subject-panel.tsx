"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getSubjectDetail, getTopicDetail } from "@/lib/queries";
import type { TopicNode } from "@/lib/queries";
import { NewTopicForm } from "@/components/subjects/new-topic-form";
import { EditTopicTitle } from "@/components/subjects/edit-topic-title";
import { TopicContentEditor } from "@/components/subjects/topic-content-editor";

interface SubjectOption {
  id: string;
  name: string;
  color: string;
}

interface SubjectPanelProps {
  subjects: SubjectOption[];
  subjectId: string | null;
  // tópico aberto dentro do painel — controlado pelo pai, para sobreviver a
  // re-renders disparados por invalidateAll() (ex.: autosave do editor).
  openTopicId: string | null;
  onChangeSubject: (subjectId: string) => void;
  onOpenTopic: (topicId: string | null) => void;
  onClose?: () => void;
}

export function SubjectPanel({
  subjects,
  subjectId,
  openTopicId,
  onChangeSubject,
  onOpenTopic,
  onClose,
}: SubjectPanelProps) {
  const selected = subjects.find((s) => s.id === subjectId) ?? null;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* cabeçalho do painel */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3">
        {selected && (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: selected.color }}
          />
        )}
        <select
          value={subjectId ?? ""}
          onChange={(e) => onChangeSubject(e.target.value)}
          aria-label="Escolher matéria do painel"
          className="min-w-0 flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5 text-sm font-medium outline-none transition-colors focus:border-[var(--color-ring)]"
        >
          <option value="" disabled>
            Escolha uma matéria…
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {selected && (
          <Link
            href={`/subject?id=${selected.id}`}
            title="Abrir matéria completa"
            aria-label="Abrir matéria completa"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            <ExternalLink className="size-4" />
          </Link>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Fechar painel"
            aria-label="Fechar painel"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* corpo do painel */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!subjectId ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Escolha uma matéria para abrir aqui.
          </div>
        ) : openTopicId ? (
          <PanelTopicView
            topicId={openTopicId}
            onBack={() => onOpenTopic(null)}
          />
        ) : (
          <PanelSubjectView
            subjectId={subjectId}
            onOpenTopic={onOpenTopic}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- visão: árvore de tópicos da matéria ---------- */

function PanelSubjectView({
  subjectId,
  onOpenTopic,
}: {
  subjectId: string;
  onOpenTopic: (id: string) => void;
}) {
  const { data, loading } = useRepoQuery(
    () => getSubjectDetail(subjectId),
    [subjectId]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Matéria não encontrada.
      </div>
    );
  }

  const { subject, topics } = data;

  return (
    <div className="space-y-3 p-3">
      <NewTopicForm subjectId={subject.id} label="Novo tópico" />
      {topics.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Sem tópicos ainda. Crie o primeiro acima.
        </p>
      ) : (
        <ul className="space-y-1">
          {topics.map((t) => (
            <PanelTopicRow
              key={t.id}
              topic={t}
              color={subject.color}
              depth={0}
              onOpenTopic={onOpenTopic}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PanelTopicRow({
  topic,
  color,
  depth,
  onOpenTopic,
}: {
  topic: TopicNode;
  color: string;
  depth: number;
  onOpenTopic: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(depth === 0);
  const hasChildren = topic.children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-1 rounded-md transition-colors hover:bg-[var(--color-accent)]"
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Recolher" : "Expandir"}
            className="flex size-6 shrink-0 items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onOpenTopic(topic.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
        >
          <Layers className="size-3.5 shrink-0" style={{ color }} />
          <span className="truncate text-sm">{topic.title}</span>
          {topic.hasContent && (
            <FileText className="size-3 shrink-0 text-[var(--color-chart-2)]" />
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="mt-1 space-y-1">
          {topic.children.map((c) => (
            <PanelTopicRow
              key={c.id}
              topic={c}
              color={color}
              depth={depth + 1}
              onOpenTopic={onOpenTopic}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ---------- visão: conteúdo de um tópico ---------- */

function PanelTopicView({
  topicId,
  onBack,
}: {
  topicId: string;
  onBack: () => void;
}) {
  const { data, loading } = useRepoQuery(
    () => getTopicDetail(topicId),
    [topicId]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        Tópico não encontrado.
      </div>
    );
  }

  const { topic, subject } = data;

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="size-3.5" />
          Tópicos
        </button>
        <span className="truncate text-xs text-[var(--color-muted-foreground)]">
          {subject.name}
        </span>
      </div>
      <EditTopicTitle topicId={topic.id} initialTitle={topic.title} />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <TopicContentEditor
          key={topic.id}
          topicId={topic.id}
          initialContent={topic.content}
        />
      </div>
    </div>
  );
}
