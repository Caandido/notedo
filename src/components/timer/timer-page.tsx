"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimerDisplay } from "@/components/timer/timer-display";
import { useTimerStore, type TimerMode } from "@/stores/timer-store";
import { useInterval } from "@/hooks/use-interval";
import { cn, formatDuration } from "@/lib/utils";
import { mockSubjects } from "@/lib/mock-data";

const MODES: { id: TimerMode; label: string; hint: string }[] = [
  { id: "pomodoro", label: "Pomodoro", hint: "25 min · com pausas" },
  { id: "free", label: "Livre", hint: "sem limite" },
  { id: "reverse", label: "Reverso", hint: "alvo de 1h" },
  { id: "custom", label: "Custom", hint: "configurar" },
];

export function TimerPageContent() {
  const {
    mode,
    running,
    elapsedSeconds,
    targetSeconds,
    subjectId,
    start,
    pause,
    reset,
    tick,
    setMode,
  } = useTimerStore();

  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(
    subjectId
  );

  useInterval(tick, running ? 250 : null);

  const displaySeconds = React.useMemo(() => {
    if (mode === "free") return elapsedSeconds;
    if (mode === "reverse") return elapsedSeconds;
    return Math.max(0, targetSeconds - elapsedSeconds);
  }, [mode, elapsedSeconds, targetSeconds]);

  const progress = React.useMemo(() => {
    if (mode === "free" || targetSeconds === 0) return undefined;
    return Math.min(1, elapsedSeconds / targetSeconds);
  }, [mode, elapsedSeconds, targetSeconds]);

  const isComplete =
    mode !== "free" && targetSeconds > 0 && elapsedSeconds >= targetSeconds;

  React.useEffect(() => {
    if (isComplete && running) {
      pause();
    }
  }, [isComplete, running, pause]);

  const currentSubject = mockSubjects.find((s) => s.id === selectedSubject);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 p-6 pt-12">
      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === m.id
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
            aria-pressed={mode === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        {MODES.find((m) => m.id === mode)?.hint}
      </p>

      <TimerDisplay seconds={displaySeconds} progress={progress} />

      <div className="flex items-center gap-2">
        {!running ? (
          <Button
            size="lg"
            className="gap-2 px-6"
            onClick={() => start(selectedSubject ?? undefined)}
            disabled={isComplete}
          >
            <Play className="size-4 fill-current" />
            {elapsedSeconds > 0 ? "Continuar" : "Iniciar"}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 px-6"
            onClick={pause}
          >
            <Pause className="size-4 fill-current" />
            Pausar
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          onClick={reset}
          disabled={elapsedSeconds === 0 && !running}
          aria-label="Reiniciar"
        >
          <RotateCcw className="size-4" />
        </Button>
        {elapsedSeconds > 60 && !running && (
          <Button size="lg" variant="outline" className="gap-2">
            <Save className="size-4" />
            Salvar sessão
          </Button>
        )}
      </div>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Estudando
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {elapsedSeconds > 0 && `${formatDuration(elapsedSeconds)} acumulado`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mockSubjects.map((subject) => {
              const active = selectedSubject === subject.id;
              return (
                <button
                  key={subject.id}
                  onClick={() =>
                    setSelectedSubject(active ? null : subject.id)
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  {subject.name}
                </button>
              );
            })}
          </div>
          {currentSubject && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sessão será atribuída a{" "}
              <span className="text-[var(--color-foreground)]">
                {currentSubject.name}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {isComplete && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Sessão concluída! Salve para registrar.
        </div>
      )}
    </div>
  );
}
