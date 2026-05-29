/**
 * Metadados de sincronização presentes em TODAS as linhas.
 * - updatedAt: ms epoch; base do last-write-wins.
 * - _dirty: 1 = mudança local ainda não enviada ao servidor.
 * Deletes NÃO usam soft-delete in-place (evita vazar "fantasma" nos reads):
 * são hard-delete local + registro em `_tombstones` (ver TombstoneRow).
 * O prefixo "_" marca campos locais que nunca vão crus ao Supabase (ver mappers).
 */
export type SyncMeta = {
  updatedAt: number;
  _dirty: 0 | 1;
};

export type LocalUser = SyncMeta & {
  id: string;
  name: string;
  email?: string;
  image?: string;
  createdAt: number;
};

export type SubjectRow = SyncMeta & {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  progress: number;
  tags: string[];
  archived: boolean;
  createdAt: number;
};

export type TopicRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string;
  parentId: string | null;
  title: string;
  content: unknown;
  order: number;
  createdAt: number;
};

export type StudySessionRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  mode: "POMODORO" | "FREE" | "REVERSE" | "CUSTOM";
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  notes?: string | null;
  focusScore?: number | null;
  createdAt: number;
};

export type GoalRow = SyncMeta & {
  id: string;
  userId: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  metric: "HOURS" | "TASKS" | "SESSIONS" | "REVIEWS";
  target: number;
  label: string;
  active: boolean;
  createdAt: number;
};

export type ReviewRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  scheduledAt: number;
  completedAt: number | null;
  interval: number;
  ease: number;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  createdAt: number;
};

export type FlashcardRow = SyncMeta & {
  id: string;
  userId: string;
  front: string;
  back: string;
  deck: string | null;
  ease: number;
  interval: number;
  nextReview: number;
  createdAt: number;
};

export type CalendarEventRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string | null;
  type: "EXAM" | "TASK" | "CLASS" | "CUSTOM";
  title: string;
  notes: string | null;
  date: number;
  done: boolean;
  createdAt: number;
};

export type GradeRow = SyncMeta & {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  type: "EXAM" | "ASSIGNMENT" | "QUIZ" | "OTHER";
  score: number;
  maxScore: number;
  weight: number;
  date: number;
  comments: string | null;
  createdAt: number;
};

/** Watermark de pull por tabela (maior updated_at já trazido do servidor, em ms). */
export type SyncStateRow = {
  table: string;
  pulledThrough: number;
};

/**
 * Lápide de exclusão. Delete = hard-delete local da linha + um registro aqui.
 * O push faz UPDATE ... SET deleted_at no servidor (0 linhas se nunca sincronizou).
 * key = `${table}:${rowId}` (PK).
 */
export type TombstoneRow = {
  key: string;
  table: SyncTableName;
  rowId: string;
  userId: string;
  deletedAt: number;
  _dirty: 0 | 1;
};

/** Nomes das tabelas de dados sincronizáveis (ordem de sync: pais antes de filhos). */
export const SYNC_TABLES = [
  "users",
  "subjects",
  "topics",
  "sessions",
  "goals",
  "reviews",
  "flashcards",
  "events",
  "grades",
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number];
