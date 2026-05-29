"use client";

import Dexie, { type Table } from "dexie";

import {
  SYNC_TABLES,
  type CalendarEventRow,
  type FlashcardRow,
  type GoalRow,
  type GradeRow,
  type LocalUser,
  type ReviewRow,
  type StudySessionRow,
  type SubjectRow,
  type SyncStateRow,
  type TombstoneRow,
  type TopicRow,
} from "./schema";

class NotedoDB extends Dexie {
  users!: Table<LocalUser, string>;
  subjects!: Table<SubjectRow, string>;
  topics!: Table<TopicRow, string>;
  sessions!: Table<StudySessionRow, string>;
  goals!: Table<GoalRow, string>;
  reviews!: Table<ReviewRow, string>;
  flashcards!: Table<FlashcardRow, string>;
  events!: Table<CalendarEventRow, string>;
  grades!: Table<GradeRow, string>;
  _sync_state!: Table<SyncStateRow, string>;
  _tombstones!: Table<TombstoneRow, string>;

  constructor() {
    super("notedo");
    this.version(1).stores({
      users: "id, email",
      subjects: "id, userId, [userId+archived], updatedAt",
      topics: "id, subjectId, parentId, [subjectId+parentId], updatedAt",
      sessions: "id, userId, subjectId, topicId, startedAt, [userId+startedAt]",
      goals: "id, userId, [userId+active], createdAt",
      reviews: "id, userId, status, scheduledAt, [userId+status], [userId+scheduledAt]",
      flashcards: "id, userId, deck, nextReview, [userId+nextReview]",
      events: "id, userId, subjectId, date, [userId+date]",
      grades: "id, userId, subjectId, date, [userId+date], [subjectId+date]",
    });

    // v2: metadados de sync (_dirty/_deleted/updatedAt), userId em topics e
    // tabela de watermark. Backfill marca tudo dirty pra primeiro push pós-login.
    this.version(2)
      .stores({
        users: "id, email, _dirty",
        subjects: "id, userId, [userId+archived], updatedAt, _dirty",
        topics:
          "id, userId, subjectId, parentId, [subjectId+parentId], updatedAt, _dirty",
        sessions:
          "id, userId, subjectId, topicId, startedAt, [userId+startedAt], updatedAt, _dirty",
        goals: "id, userId, [userId+active], createdAt, updatedAt, _dirty",
        reviews:
          "id, userId, status, scheduledAt, [userId+status], [userId+scheduledAt], updatedAt, _dirty",
        flashcards: "id, userId, deck, nextReview, [userId+nextReview], updatedAt, _dirty",
        events: "id, userId, subjectId, date, [userId+date], updatedAt, _dirty",
        grades:
          "id, userId, subjectId, date, [userId+date], [subjectId+date], updatedAt, _dirty",
        _sync_state: "table",
        _tombstones: "key, _dirty",
      })
      .upgrade(async (tx) => {
        for (const name of SYNC_TABLES) {
          await tx
            .table(name)
            .toCollection()
            .modify((r: Record<string, unknown>) => {
              r._dirty = 1;
              if (r.updatedAt == null) {
                r.updatedAt = (r.createdAt as number) ?? Date.now();
              }
              // topics ganham userId denormalizado; backfill resolvido no
              // sync/migração (subjectId conhecido), aqui só garante o campo.
              if (name === "topics" && r.userId == null) r.userId = "";
            });
        }
      });
  }
}

let _db: NotedoDB | null = null;

export function db(): NotedoDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie só pode ser usado no client.");
  }
  if (!_db) _db = new NotedoDB();
  return _db;
}

/** Fecha e zera o singleton (usado no sign-out após apagar o IndexedDB). */
export function resetDbSingleton(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function cuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

const USER_KEY = "notedo:userId";

export function getOrInitLocalUser(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(USER_KEY);
  if (id) return id;
  id = cuid();
  window.localStorage.setItem(USER_KEY, id);
  const now = Date.now();
  void db()
    .users.put({
      id,
      name: "Você",
      createdAt: now,
      updatedAt: now,
      _dirty: 1,
    })
    .catch(() => {});
  return id;
}
