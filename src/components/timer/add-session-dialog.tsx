"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { saveStudySession } from "@/features/timer/actions";
import type { TimerMode } from "@/stores/timer-store";
import { cn } from "@/lib/utils";

type SubjectOption = { id: string; name: string; color: string };

interface AddSessionDialogProps {
  subjects: SubjectOption[];
  defaultSubjectIds?: string[];
  onClose: () => void;
}

const MODES: { id: TimerMode; label: string }[] = [
  { id: "free", label: "Livre" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "reverse", label: "Reverso" },
  { id: "custom", label: "Custom" },
];

/** Data/hora de agora no formato dos inputs (date + time), respeitando o fuso. */
function nowParts(): { date: string; time: string } {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/**
 * Modal pra registrar uma sessão de estudo MANUALMENTE (sem cronômetro) — ex.:
 * estudou no caderno/fora do app e quer lançar o tempo. Reusa saveStudySession,
 * que já aceita startedAt; aqui montamos a duração (horas + minutos) e o início.
 */
export function AddSessionDialog({
  subjects,
  defaultSubjectIds,
  onClose,
}: AddSessionDialogProps) {
  const router = useRouter();
  const init = React.useMemo(nowParts, []);
  const [subjectIds, setSubjectIds] = React.useState<string[]>(
    defaultSubjectIds ?? []
  );
  const [mode, setMode] = React.useState<TimerMode>("free");

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  const [hours, setHours] = React.useState("0");
  const [minutes, setMinutes] = React.useState("30");
  const [date, setDate] = React.useState(init.date);
  const [time, setTime] = React.useState(init.time);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const durationSeconds = h * 3600 + m * 60;
    if (durationSeconds < 60)
      return setError("Informe pelo menos 1 minuto.");
    if (durationSeconds > 24 * 3600)
      return setError("Máximo de 24 horas por sessão.");
    const startedAt = new Date(`${date}T${time || "12:00"}`);
    if (Number.isNaN(startedAt.getTime())) return setError("Data inválida.");

    setSubmitting(true);
    setError(null);
    const result = await saveStudySession({
      subjectId: subjectIds[0] ?? null,
      subjectIds,
      mode,
      durationSeconds,
      startedAt: startedAt.toISOString(),
    });
    setSubmitting(false);
    if (result.ok) {
      onClose();
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">Adicionar sessão</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Registre um tempo estudado fora do cronômetro.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Duração
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="h-9 w-16 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
                />
                <span className="text-xs text-[var(--color-muted-foreground)]">h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="h-9 w-16 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
                />
                <span className="text-xs text-[var(--color-muted-foreground)]">min</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-ring)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Matérias <span className="opacity-60">(opcional · pode escolher várias)</span>
            </label>
            {subjects.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Nenhuma matéria cadastrada.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const active = subjectIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                        active
                          ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                      )}
                      aria-pressed={active}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Modo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs transition-colors",
                    mode === m.id
                      ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  aria-pressed={mode === m.id}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Adicionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
