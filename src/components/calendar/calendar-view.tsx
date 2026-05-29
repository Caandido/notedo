"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import { NewEventForm } from "@/components/calendar/new-event-form";
import { EventItem } from "@/components/calendar/event-item";
import {
  EVENT_COLORS,
  type EventType,
} from "@/components/calendar/event-styles";

type Session = {
  id: string;
  startedAt: Date | string;
  durationSeconds: number;
  mode: "pomodoro" | "free" | "reverse" | "custom";
  subjectName: string | null;
  subjectColor: string | null;
};

type Review = {
  id: string;
  title: string;
  status: "pending" | "completed" | "skipped";
  scheduledAt: Date | string;
  subjectName: string | null;
  subjectColor: string | null;
};

type CalEvent = {
  id: string;
  title: string;
  type: EventType;
  date: Date | string;
  done: boolean;
  notes: string | null;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
};

type DayCell = {
  key: string;
  date: Date | string;
  seconds: number;
  sessions: Session[];
  reviews: Review[];
  events: CalEvent[];
};

type SubjectOption = { id: string; name: string; color: string };

interface CalendarViewProps {
  year: number;
  month: number;
  days: DayCell[];
  subjects: SubjectOption[];
  /** Quando fornecido, a navegação de mês usa estado local (embed no dashboard)
   * em vez de reescrever a URL (página /calendar). */
  onNavigate?: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function intensity(seconds: number): number {
  const h = seconds / 3600;
  if (h === 0) return 0;
  if (h < 0.5) return 1;
  if (h < 1.5) return 2;
  if (h < 3) return 3;
  return 4;
}

const intensityClass: Record<number, string> = {
  0: "bg-transparent",
  1: "bg-[var(--color-chart-1)]/15",
  2: "bg-[var(--color-chart-1)]/30",
  3: "bg-[var(--color-chart-1)]/55",
  4: "bg-[var(--color-chart-1)]/80",
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIsoDate(d: Date): string {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

export function CalendarView({
  year,
  month,
  days,
  subjects,
  onNavigate,
}: CalendarViewProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [selectedKey, setSelectedKey] = React.useState<string | null>(
    () => days.find((d) => isSameDay(new Date(d.date), new Date()))?.key ?? null
  );

  const today = new Date();

  function targetYM(deltaMonths: number) {
    const d = new Date(year, month + deltaMonths, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  function navHref(deltaMonths: number) {
    const { y, m } = targetYM(deltaMonths);
    const search = new URLSearchParams(params);
    search.set("y", y.toString());
    search.set("m", m.toString());
    return `${pathname}?${search.toString()}`;
  }

  function todayHref() {
    const search = new URLSearchParams(params);
    search.set("y", today.getFullYear().toString());
    search.set("m", today.getMonth().toString());
    return `${pathname}?${search.toString()}`;
  }

  function deltaToToday() {
    return (today.getFullYear() - year) * 12 + (today.getMonth() - month);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => i);

  const selected = selectedKey
    ? days.find((d) => d.key === selectedKey)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onNavigate ? (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Mês anterior"
                onClick={() => {
                  const { y, m } = targetYM(-1);
                  onNavigate(y, m);
                }}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Próximo mês"
                onClick={() => {
                  const { y, m } = targetYM(1);
                  onNavigate(y, m);
                }}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(today.getFullYear(), today.getMonth())}
                disabled={deltaToToday() === 0}
              >
                Hoje
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="icon" aria-label="Mês anterior">
                <Link href={navHref(-1)}>
                  <ChevronLeft className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Próximo mês">
                <Link href={navHref(1)}>
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={todayHref()}>Hoje</Link>
              </Button>
            </>
          )}
        </div>
        <h2 className="text-sm font-semibold tracking-tight">
          {MONTH_NAMES[month]} de {year}
        </h2>
      </div>

      <NewEventForm
        subjects={subjects}
        defaultDate={selected ? toIsoDate(new Date(selected.date)) : undefined}
        size="sm"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {leadingBlanks.map((i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}
              {days.map((d) => {
                const dt = new Date(d.date);
                const isToday = isSameDay(dt, today);
                const isSelected = d.key === selectedKey;
                const dueReviews = d.reviews.filter(
                  (r) => r.status === "pending"
                ).length;
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedKey(d.key)}
                    className={cn(
                      "group relative aspect-square rounded-md p-1.5 text-left transition-colors hover:bg-[var(--color-accent)]/60",
                      intensityClass[intensity(d.seconds)],
                      isSelected &&
                        "ring-2 ring-[var(--color-ring)] ring-offset-1 ring-offset-[var(--color-background)]",
                      isToday && !isSelected && "ring-1 ring-[var(--color-foreground)]/30"
                    )}
                    aria-label={dt.toLocaleDateString("pt-BR")}
                  >
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        isToday && "font-semibold"
                      )}
                    >
                      {dt.getDate()}
                    </span>
                    {d.seconds > 0 && (
                      <div className="mt-0.5 text-[9px] font-medium tabular-nums leading-none text-[var(--color-foreground)]/80">
                        {(d.seconds / 3600).toFixed(1)}h
                      </div>
                    )}
                    {dueReviews > 0 && (
                      <span
                        className="absolute right-1 top-1 size-1.5 rounded-full bg-emerald-400"
                        title={`${dueReviews} revisão${dueReviews === 1 ? "" : "ões"} agendada${dueReviews === 1 ? "" : "s"}`}
                      />
                    )}
                    {d.events.length > 0 && (
                      <div className="absolute bottom-1 left-1 flex gap-0.5">
                        {Array.from(new Set(d.events.map((e) => e.type)))
                          .slice(0, 4)
                          .map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "size-1.5 rounded-full",
                                EVENT_COLORS[t].dot
                              )}
                              title={t}
                            />
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            {selected ? (
              <>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(selected.date).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">
                    {selected.seconds > 0
                      ? formatDuration(selected.seconds)
                      : "Sem estudo"}
                    {selected.sessions.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-[var(--color-muted-foreground)]">
                        · {selected.sessions.length}{" "}
                        {selected.sessions.length === 1 ? "sessão" : "sessões"}
                      </span>
                    )}
                  </p>
                </div>

                {selected.events.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      Eventos
                    </p>
                    <ul className="space-y-1.5">
                      {selected.events.map((e) => (
                        <EventItem key={e.id} event={e} />
                      ))}
                    </ul>
                  </div>
                )}

                {selected.reviews.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      Revisões
                    </p>
                    <ul className="space-y-1.5">
                      {selected.reviews.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {r.subjectColor && (
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: r.subjectColor }}
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {r.title}
                          </span>
                          {r.status !== "pending" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] capitalize"
                            >
                              {r.status === "completed" ? "feita" : "pulada"}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.sessions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      Sessões
                    </p>
                    <ul className="space-y-1.5">
                      {selected.sessions.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {s.subjectColor && (
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: s.subjectColor }}
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {s.subjectName ?? "Sem matéria"}
                          </span>
                          <span className="font-mono tabular-nums text-[var(--color-muted-foreground)]">
                            {formatDuration(s.durationSeconds)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.sessions.length === 0 &&
                  selected.reviews.length === 0 &&
                  selected.events.length === 0 && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Nada registrado neste dia.
                    </p>
                  )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="size-5 text-[var(--color-muted-foreground)]" />
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Clique em um dia para ver detalhes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
