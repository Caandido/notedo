export type EventType = "exam" | "task" | "class" | "custom";

export const EVENT_LABELS: Record<EventType, string> = {
  exam: "Prova",
  task: "Atividade",
  class: "Aula",
  custom: "Evento",
};

export const EVENT_COLORS: Record<
  EventType,
  { dot: string; bg: string; text: string; border: string }
> = {
  exam: {
    dot: "bg-rose-400",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/40",
  },
  task: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/40",
  },
  class: {
    dot: "bg-sky-400",
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    border: "border-sky-500/40",
  },
  custom: {
    dot: "bg-violet-400",
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    border: "border-violet-500/40",
  },
};
