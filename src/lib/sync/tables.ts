"use client";

// Descritores de mapeamento local (Dexie, camelCase, ms epoch) <-> remoto
// (Supabase, snake_case, ISO timestamptz). Só as 8 tabelas de dados — o perfil
// (users/profiles) fica fora do motor por enquanto.

type Field = { col: string; ts?: boolean; json?: boolean };

export type TableDesc = {
  local: "subjects" | "topics" | "sessions" | "goals" | "reviews" | "flashcards" | "events" | "grades" | "mindmaps";
  remote: string;
  chunk: number;
  fields: Record<string, Field>;
};

const ID: Field = { col: "id" };
const UID: Field = { col: "user_id" };
const CREATED: Field = { col: "created_at", ts: true };
const UPDATED: Field = { col: "updated_at", ts: true };

export const TABLE_DESCRIPTORS: TableDesc[] = [
  {
    local: "subjects",
    remote: "subjects",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      name: { col: "name" },
      color: { col: "color" },
      icon: { col: "icon" },
      priority: { col: "priority" },
      progress: { col: "progress" },
      tags: { col: "tags", json: true },
      archived: { col: "archived" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "topics",
    remote: "topics",
    chunk: 50,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      parentId: { col: "parent_id" },
      title: { col: "title" },
      content: { col: "content", json: true },
      order: { col: "order" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "sessions",
    remote: "sessions",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      topicId: { col: "topic_id" },
      mode: { col: "mode" },
      startedAt: { col: "started_at", ts: true },
      endedAt: { col: "ended_at", ts: true },
      durationSeconds: { col: "duration_seconds" },
      notes: { col: "notes" },
      focusScore: { col: "focus_score" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "goals",
    remote: "goals",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      type: { col: "type" },
      metric: { col: "metric" },
      target: { col: "target" },
      label: { col: "label" },
      active: { col: "active" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "reviews",
    remote: "reviews",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      title: { col: "title" },
      scheduledAt: { col: "scheduled_at", ts: true },
      completedAt: { col: "completed_at", ts: true },
      interval: { col: "interval" },
      ease: { col: "ease" },
      status: { col: "status" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "flashcards",
    remote: "flashcards",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      front: { col: "front" },
      back: { col: "back" },
      deck: { col: "deck" },
      ease: { col: "ease" },
      interval: { col: "interval" },
      nextReview: { col: "next_review", ts: true },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "events",
    remote: "events",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      type: { col: "type" },
      title: { col: "title" },
      notes: { col: "notes" },
      date: { col: "date", ts: true },
      done: { col: "done" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "grades",
    remote: "grades",
    chunk: 200,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      title: { col: "title" },
      type: { col: "type" },
      score: { col: "score" },
      maxScore: { col: "max_score" },
      weight: { col: "weight" },
      date: { col: "date", ts: true },
      comments: { col: "comments" },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
  {
    local: "mindmaps",
    remote: "mindmaps",
    chunk: 50,
    fields: {
      id: ID,
      userId: UID,
      subjectId: { col: "subject_id" },
      title: { col: "title" },
      data: { col: "data", json: true },
      createdAt: CREATED,
      updatedAt: UPDATED,
    },
  },
];

/** Linha local -> payload remoto (snake_case, ISO). Marca deleted_at=null (live). */
export function toRemote(
  desc: TableDesc,
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { deleted_at: null };
  for (const [localKey, f] of Object.entries(desc.fields)) {
    const v = row[localKey];
    out[f.col] = f.ts && typeof v === "number" ? new Date(v).toISOString() : v ?? null;
  }
  return out;
}

/** Linha remota -> linha local (camelCase, ms). Sem metadados de sync (engine seta). */
export function fromRemote(
  desc: TableDesc,
  rr: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [localKey, f] of Object.entries(desc.fields)) {
    const v = rr[f.col];
    out[localKey] =
      f.ts && typeof v === "string" ? new Date(v).getTime() : v ?? null;
  }
  return out;
}
