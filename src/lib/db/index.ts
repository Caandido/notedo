"use client";

import Dexie, { type Table } from "dexie";

import type {
  CalendarEventRow,
  FlashcardRow,
  GoalRow,
  GradeRow,
  LocalUser,
  ReviewRow,
  StudySessionRow,
  SubjectRow,
  TopicRow,
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

export function cuid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

const USER_KEY = "notedo:userId";

export function getOrInitLocalUser(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(USER_KEY);
  if (id) return id;
  id = cuid();
  window.localStorage.setItem(USER_KEY, id);
  void db()
    .users.put({
      id,
      name: "Você",
      createdAt: Date.now(),
    })
    .catch(() => {});
  return id;
}
