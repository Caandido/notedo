"use client";

import * as React from "react";
import { Check, Loader2, Moon, Monitor, Sun, Timer } from "lucide-react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type UserSettings,
} from "@/lib/settings";

interface SettingsViewProps {
  profile: {
    name: string;
    email: string;
    subjectCount: number;
    sessionCount: number;
    flashcardCount: number;
  };
}

const THEMES = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
] as const;

export function SettingsView({ profile }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [settings, setSettings] = React.useState<UserSettings>(DEFAULT_SETTINGS);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">(
    "idle"
  );

  React.useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);

  function updateTimer(patch: Partial<UserSettings["timer"]>) {
    setSettings((s) => {
      const next = { ...s, timer: { ...s.timer, ...patch } };
      saveSettings(next);
      return next;
    });
    setSaveState("saving");
    setTimeout(() => setSaveState("saved"), 200);
    setTimeout(() => setSaveState("idle"), 1500);
  }

  function resetTimer() {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.name}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {profile.email}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
            {[
              { label: "Matérias", value: profile.subjectCount },
              { label: "Sessões", value: profile.sessionCount },
              { label: "Flashcards", value: profile.flashcardCount },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ id, label, icon: Icon }) => {
              const active = mounted && theme === id;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors",
                    active
                      ? "border-[var(--color-ring)] bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Timer className="size-4 text-[var(--color-muted-foreground)]" />
            Defaults do cronômetro
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            {saveState === "saving" && <Loader2 className="size-3 animate-spin" />}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Check className="size-3" /> Salvo
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DurationField
            label="Pomodoro"
            seconds={settings.timer.pomodoroSeconds}
            onChange={(s) => updateTimer({ pomodoroSeconds: s })}
            min={5 * 60}
            max={120 * 60}
            step={5 * 60}
          />
          <DurationField
            label="Custom"
            seconds={settings.timer.customSeconds}
            onChange={(s) => updateTimer({ customSeconds: s })}
            min={5 * 60}
            max={240 * 60}
            step={5 * 60}
          />
          <DurationField
            label="Reverso (alvo)"
            seconds={settings.timer.reverseSeconds}
            onChange={(s) => updateTimer({ reverseSeconds: s })}
            min={30 * 60}
            max={8 * 60 * 60}
            step={15 * 60}
          />
          <div className="flex justify-end border-t border-[var(--color-border)] pt-3">
            <Button variant="ghost" size="sm" onClick={resetTimer}>
              Restaurar defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        Preferências do timer ficam no navegador (localStorage). Sincronização
        entre dispositivos chega quando o auth real for ativado.
      </p>
    </div>
  );
}

interface DurationFieldProps {
  label: string;
  seconds: number;
  min: number;
  max: number;
  step: number;
  onChange: (s: number) => void;
}

function DurationField({
  label,
  seconds,
  min,
  max,
  step,
  onChange,
}: DurationFieldProps) {
  const minutes = Math.round(seconds / 60);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums text-[var(--color-muted-foreground)]">
          {minutes} min
        </span>
      </div>
      <input
        type="range"
        min={min / 60}
        max={max / 60}
        step={step / 60}
        value={minutes}
        onChange={(e) => onChange(parseInt(e.target.value, 10) * 60)}
        className="w-full accent-[var(--color-chart-1)]"
      />
    </div>
  );
}
