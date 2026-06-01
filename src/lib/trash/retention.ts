/** Dias que um item fica na Lixeira antes de ser apagado definitivamente. */
export const TRASH_RETENTION_DAYS = 12;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Tabelas cujas exclusões passam pela Lixeira (todas as de dados; `users` não). */
export const TRASH_TABLES = [
  "subjects",
  "topics",
  "sessions",
  "goals",
  "reviews",
  "flashcards",
  "events",
  "grades",
  "mindmaps",
  "activities",
] as const;

export type TrashTable = (typeof TRASH_TABLES)[number];

/** Rótulo (PT) e extrator de título por tabela, pra exibir na Lixeira. */
export const TRASH_LABELS: Record<
  TrashTable,
  { label: string; title: (r: Record<string, unknown>) => string }
> = {
  subjects: { label: "Matéria", title: (r) => String(r.name ?? "Matéria") },
  topics: { label: "Tópico", title: (r) => String(r.title ?? "Tópico") },
  sessions: { label: "Sessão", title: () => "Sessão de estudo" },
  goals: { label: "Meta", title: (r) => String(r.label ?? "Meta") },
  reviews: { label: "Revisão", title: (r) => String(r.title ?? "Revisão") },
  flashcards: { label: "Flashcard", title: (r) => String(r.front ?? "Flashcard") },
  events: { label: "Evento", title: (r) => String(r.title ?? "Evento") },
  grades: { label: "Nota", title: (r) => String(r.title ?? "Nota") },
  mindmaps: { label: "Mapa mental", title: (r) => String(r.title ?? "Mapa") },
  activities: { label: "Atividade", title: (r) => String(r.title ?? "Atividade") },
};
