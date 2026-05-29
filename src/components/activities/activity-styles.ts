import type { ActivityStatus, ActivityType } from "@/lib/db/schema";

export const ACTIVITY_TYPES: ActivityType[] = [
  "ATIVIDADE",
  "REDACAO",
  "TRABALHO",
  "EXERCICIO",
  "PROVA",
];

export const TYPE_LABELS: Record<ActivityType, string> = {
  ATIVIDADE: "Atividade",
  REDACAO: "Redação",
  TRABALHO: "Trabalho",
  EXERCICIO: "Exercício",
  PROVA: "Prova",
};

export const TYPE_COLORS: Record<
  ActivityType,
  { dot: string; bg: string; text: string }
> = {
  ATIVIDADE: { dot: "bg-amber-400", bg: "bg-amber-500/15", text: "text-amber-300" },
  REDACAO: { dot: "bg-violet-400", bg: "bg-violet-500/15", text: "text-violet-300" },
  TRABALHO: { dot: "bg-sky-400", bg: "bg-sky-500/15", text: "text-sky-300" },
  EXERCICIO: { dot: "bg-emerald-400", bg: "bg-emerald-500/15", text: "text-emerald-300" },
  PROVA: { dot: "bg-rose-400", bg: "bg-rose-500/15", text: "text-rose-300" },
};

export const STATUSES: ActivityStatus[] = ["TODO", "DOING", "DONE"];

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  TODO: "A fazer",
  DOING: "Fazendo",
  DONE: "Concluído",
};
