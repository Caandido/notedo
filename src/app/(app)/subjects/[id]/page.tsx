import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
import { formatDuration, formatHours } from "@/lib/utils";
import { getSubjectDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

const priorityLabel = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

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

interface SubjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubjectDetailPage({
  params,
}: SubjectDetailPageProps) {
  const { id } = await params;
  const detail = await getSubjectDetail(id);
  if (!detail) notFound();

  const { subject, topics, topicCount, totalSeconds, sessionCount, recentSessions } =
    detail;

  return (
    <>
      <Header
        title={subject.name}
        subtitle={`${topicCount} tópico${topicCount === 1 ? "" : "s"} · ${formatHours(totalSeconds)} estudados`}
      />
      <div className="space-y-6 p-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <Link href="/subjects">
              <ArrowLeft className="size-3.5" />
              Todas as matérias
            </Link>
          </Button>
        </div>

        <section className="flex flex-wrap items-center gap-3">
          <span
            className="flex size-12 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${subject.color}26`,
              border: `1px solid ${subject.color}66`,
            }}
          >
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: subject.color }}
            />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {subject.name}
              </h1>
              <Badge variant="outline" className="text-[10px]">
                {priorityLabel[subject.priority]}
              </Badge>
              {subject.archived && (
                <Badge variant="secondary">Arquivada</Badge>
              )}
            </div>
            {subject.tags.length > 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {subject.tags.join(" · ")}
              </p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="size-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Tempo total
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
                  Tópicos
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {topicCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="size-4 text-[var(--color-muted-foreground)]" />
              Tópicos
            </CardTitle>
            <NewTopicForm subjectId={subject.id} />
          </CardHeader>
          <CardContent>
            <TopicTree subjectId={subject.id} topics={topics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="size-4 text-[var(--color-muted-foreground)]" />
              Sessões recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhuma sessão registrada nesta matéria ainda.
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
