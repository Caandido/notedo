"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Pause,
  Pencil,
  Play,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  deleteGoal,
  toggleGoalActive,
  updateGoal,
} from "@/features/goals/actions";

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
  const [editing, setEditing] = React.useState(false);
  const [label, setLabel] = React.useState(goal.label);
  const [target, setTarget] = React.useState(goal.target.toString());
  const [busy, setBusy] = React.useState<
    "toggle" | "delete" | "save" | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

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

  async function onSave() {
    const num = parseFloat(target);
    if (!label.trim()) return setError("Label obrigatório.");
    if (!Number.isFinite(num) || num <= 0) return setError("Meta inválida.");
    setBusy("save");
    setError(null);
    const result = await updateGoal({ id: goal.id, label, target: num });
    setBusy(null);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setLabel(goal.label);
    setTarget(goal.target.toString());
    setError(null);
  }

  return (
    <Card
      className={cn(
        "group transition-shadow hover:shadow-md",
        !goal.active && !editing && "opacity-60"
      )}
    >
      <CardContent className="space-y-3 p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={60}
                autoFocus
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="h-9 w-28 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
                />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {metricLabel[goal.metric]} ·{" "}
                  {typeLabel[goal.type].toLowerCase()}
                </span>
              </div>
            </div>
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={busy === "save"}
              >
                <X className="size-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={busy === "save"}
                className="gap-1.5"
              >
                {busy === "save" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {goal.label}
                  </h3>
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
                  onClick={() => setEditing(true)}
                  disabled={busy !== null}
                  aria-label="Editar"
                >
                  <Pencil className="size-3.5" />
                </Button>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
