import type { CardPriority } from "@/lib/db/schema";

export const PRIORITIES: CardPriority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

export const PRIORITY_LABELS: Record<CardPriority, string> = {
  NONE: "Sem prioridade",
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

/** Cor do "pingo" de prioridade no card. */
export const PRIORITY_DOT: Record<CardPriority, string> = {
  NONE: "bg-zinc-500",
  LOW: "bg-sky-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-rose-400",
};

/** Paleta de cores pros quadros (acento por projeto). */
export const BOARD_COLORS = [
  "#7c7cf0",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#fb7185",
  "#a78bfa",
  "#22d3ee",
];
