"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pause, Play, Plus, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimerDisplay } from "@/components/timer/timer-display";
import { AddSessionDialog } from "@/components/timer/add-session-dialog";
import { useTimerStore, type TimerMode } from "@/stores/timer-store";
import { useInterval } from "@/hooks/use-interval";
import { cn, formatDuration } from "@/lib/utils";
import { saveStudySession } from "@/features/timer/actions";
import { loadSettings } from "@/lib/settings";

type SubjectOption = { id: string; name: string; color: string };

interface TimerPageContentProps {
  subjects: SubjectOption[];
}

const MODES: { id: TimerMode; label: string; hint: string }[] = [
  { id: "pomodoro", label: "Pomodoro", hint: "25 min · com pausas" },
  { id: "free", label: "Livre", hint: "sem limite" },
  { id: "reverse", label: "Reverso", hint: "alvo de 1h" },
  { id: "custom", label: "Custom", hint: "configurar" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export function TimerPageContent({ subjects }: TimerPageContentProps) {
  const router = useRouter();
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
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (running || elapsedSeconds > 0) return;
    const settings = loadSettings();
    const targets: Record<TimerMode, number> = {
      pomodoro: settings.timer.pomodoroSeconds,
      free: 0,
      reverse: settings.timer.reverseSeconds,
      custom: settings.timer.customSeconds,
    };
    const target = targets[mode];
    if (target !== targetSeconds) {
      useTimerStore.setState({ targetSeconds: target });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
    if (isComplete && running) pause();
  }, [isComplete, running, pause]);

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  async function handleSave() {
    if (elapsedSeconds < 1) return;
    setSaveState("saving");
    setSaveError(null);
    const result = await saveStudySession({
      subjectId: selectedSubject,
      mode,
      durationSeconds: elapsedSeconds,
    });
    if (result.ok) {
      setSaveState("saved");
      reset();
      router.refresh();
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      setSaveState("error");
      setSaveError(result.error);
    }
  }

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

      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-[var(--color-muted-foreground)]"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="size-3.5" />
        Adicionar sessão manual
      </Button>

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
          disabled={(elapsedSeconds === 0 && !running) || saveState === "saving"}
          aria-label="Reiniciar"
        >
          <RotateCcw className="size-4" />
        </Button>
        {elapsedSeconds > 5 && !running && (
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={handleSave}
            disabled={saveState === "saving"}
          >
            {saveState === "saving" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saveState === "saved" ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Save className="size-4" />
            )}
            {saveState === "saved" ? "Salvo!" : "Salvar sessão"}
          </Button>
        )}
      </div>

      {saveState === "error" && saveError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {saveError}
        </div>
      )}

      <Card className="w-full">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Estudando
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {elapsedSeconds > 0 &&
                `${formatDuration(elapsedSeconds)} acumulado`}
            </p>
          </div>
          {subjects.length === 0 ? (
            <p className="py-2 text-sm text-[var(--color-muted-foreground)]">
              Nenhuma matéria cadastrada.{" "}
              <a
                href="/subjects"
                className="text-[var(--color-foreground)] underline-offset-4 hover:underline"
              >
                Criar uma agora
              </a>
              .
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((subject) => {
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
          )}
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

      {isComplete && saveState !== "saved" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Sessão concluída! Salve para registrar.
        </div>
      )}

      {addOpen && (
        <AddSessionDialog
          subjects={subjects}
          defaultSubjectId={selectedSubject}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
