"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { deleteGoal, toggleGoalActive } from "@/features/goals/actions";

interface GoalRowProps {
  goal: {
    id: string;
    label: string;
    type: "daily" | "weekly" | "monthly";
    metric: "hours" | "tasks" | "sessions" | "reviews";
    target: number;
    current: number;
    active: boolean;
    progress: number;
  };
}

const typeLabel = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
};

const metricLabel = {
  hours: "h",
  sessions: "sessões",
  tasks: "tarefas",
  reviews: "revisões",
};

export function GoalRow({ goal }: GoalRowProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"toggle" | "delete" | null>(null);

  async function onToggle() {
    setBusy("toggle");
    const result = await toggleGoalActive(goal.id, !goal.active);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function onDelete() {
    if (!confirm(`Deletar "${goal.label}"?`)) return;
    setBusy("delete");
    const result = await deleteGoal(goal.id);
    setBusy(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <Card
      className={cn(
        "group transition-shadow hover:shadow-md",
        !goal.active && "opacity-60"
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{goal.label}</h3>
              <Badge variant="outline" className="text-[10px]">
                {typeLabel[goal.type]}
              </Badge>
              {!goal.active && (
                <Badge variant="secondary" className="text-[10px]">
                  Pausada
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {goal.current.toLocaleString("pt-BR")} de{" "}
              {goal.target.toLocaleString("pt-BR")} {metricLabel[goal.metric]}
              {goal.progress >= 100 && " · concluída ✨"}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              disabled={busy !== null}
              aria-label={goal.active ? "Pausar" : "Retomar"}
            >
              {busy === "toggle" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : goal.active ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={busy !== null}
              aria-label="Deletar"
            >
              {busy === "delete" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
        <Progress value={goal.progress} className="h-1.5" />
      </CardContent>
    </Card>
  );
}
