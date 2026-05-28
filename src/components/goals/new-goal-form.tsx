"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createGoal } from "@/features/goals/actions";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "daily" as const, label: "Diária" },
  { id: "weekly" as const, label: "Semanal" },
  { id: "monthly" as const, label: "Mensal" },
];

const METRICS = [
  { id: "hours" as const, label: "Horas", unit: "h" },
  { id: "sessions" as const, label: "Sessões", unit: "" },
  { id: "tasks" as const, label: "Tarefas", unit: "" },
  { id: "reviews" as const, label: "Revisões", unit: "" },
];

export function NewGoalForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [metric, setMetric] =
    React.useState<"hours" | "tasks" | "sessions" | "reviews">("hours");
  const [target, setTarget] = React.useState("4");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setOpen(false);
    setLabel("");
    setType("daily");
    setMetric("hours");
    setTarget("4");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(target);
    if (!label.trim()) return setError("Label obrigatório.");
    if (!Number.isFinite(num) || num <= 0) return setError("Meta inválida.");

    setSubmitting(true);
    setError(null);
    const result = await createGoal({ label, type, metric, target: num });
    setSubmitting(false);
    if (result.ok) {
      close();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova meta
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold">Nova meta</h3>
            <button
              type="button"
              onClick={close}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label="Cancelar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Nome
            </label>
            <input
              type="text"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Meta diária"
              maxLength={60}
              className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Período
              </label>
              <div className="flex flex-col gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs transition-colors",
                      type === t.id
                        ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                        : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    )}
                    aria-pressed={type === t.id}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Métrica
              </label>
              <div className="flex flex-col gap-1">
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs transition-colors",
                      metric === m.id
                        ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                        : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    )}
                    aria-pressed={metric === m.id}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Meta
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-9 w-32 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {METRICS.find((m) => m.id === metric)?.label.toLowerCase()}{" "}
                {type === "daily"
                  ? "por dia"
                  : type === "weekly"
                    ? "por semana"
                    : "por mês"}
              </span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
