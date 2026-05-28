import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  History,
  Layers,
  Timer as TimerIcon,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopicTree } from "@/components/subjects/topic-tree";
import { NewTopicForm } from "@/components/subjects/new-topic-form";
import { EditTopicTitle } from "@/components/subjects/edit-topic-title";
import { TopicContentEditor } from "@/components/subjects/topic-content-editor";
import { formatDuration, formatHours } from "@/lib/utils";
import { getTopicDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

const modeLabel: Record<string, string> = {
  pomodoro: "Pomodoro",
  free: "Livre",
  reverse: "Reverso",
  custom: "Custom",
};

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
}

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { id } = await params;
  const detail = await getTopicDetail(id);
  if (!detail) notFound();

  const {
    topic,
    subject,
    ancestors,
    children,
    descendantCount,
    totalSeconds,
    sessionCount,
    recentSessions,
  } = detail;

  return (
    <>
      <Header
        title={topic.title}
        subtitle={`${subject.name}${descendantCount > 0 ? ` · ${descendantCount} subtópico${descendantCount === 1 ? "" : "s"}` : ""}`}
      />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 h-7">
            <Link href="/subjects">
              <ArrowLeft className="size-3.5" />
              Matérias
            </Link>
          </Button>
          <ChevronRight className="size-3" />
          <Link
            href={`/subjects/${subject.id}`}
            className="rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          >
            {subject.name}
          </Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex items-center gap-1">
              <ChevronRight className="size-3" />
              <Link
                href={`/topics/${a.id}`}
                className="rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
              >
                {a.title}
              </Link>
            </span>
          ))}
          <ChevronRight className="size-3" />
          <span className="text-[var(--color-foreground)]">{topic.title}</span>
        </div>

        <section className="flex flex-wrap items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${subject.color}26`,
              border: `1px solid ${subject.color}66`,
            }}
          >
            <Layers className="size-4" style={{ color: subject.color }} />
          </span>
          <EditTopicTitle topicId={topic.id} initialTitle={topic.title} />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="size-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Tempo nesta árvore
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatHours(totalSeconds)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <TimerIcon className="size-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Sessões
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {sessionCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Layers className="size-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Subtópicos
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {descendantCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="p-6">
            <TopicContentEditor
              topicId={topic.id}
              initialContent={topic.content}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="size-4 text-[var(--color-muted-foreground)]" />
              Subtópicos
            </CardTitle>
            <NewTopicForm
              subjectId={subject.id}
              parentId={topic.id}
              label="Novo subtópico"
            />
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhum subtópico ainda. Crie o primeiro acima ou estude direto
                neste tópico.
              </p>
            ) : (
              <TopicTree
                subjectId={subject.id}
                subjectColor={subject.color}
                topics={children}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="size-4 text-[var(--color-muted-foreground)]" />
              Sessões neste tópico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhuma sessão registrada neste tópico ainda. (O cronômetro
                hoje grava só por matéria — em breve dá pra atribuir por
                tópico também.)
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {recentSessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {relativeTime(s.startedAt)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {modeLabel[s.mode] ?? s.mode}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-[var(--color-muted-foreground)]">
                      {formatDuration(s.durationSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
