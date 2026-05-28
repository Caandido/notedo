import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import type { StudySession } from "@/types";

interface SessionsCardProps {
  sessions: StudySession[];
}

const modeLabel: Record<StudySession["mode"], string> = {
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

export function SessionsCard({ sessions }: SessionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-[var(--color-muted-foreground)]" />
          Sessões recentes
        </CardTitle>
        <Link
          href="/timer"
          className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          Histórico
          <ArrowUpRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-0">
        <ul className="divide-y divide-[var(--color-border)]">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: session.subjectColor }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {session.subjectName}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {relativeTime(session.startedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {modeLabel[session.mode]}
                </Badge>
                <span className="font-mono text-xs tabular-nums text-[var(--color-muted-foreground)]">
                  {formatDuration(session.durationSeconds)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
