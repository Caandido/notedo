"use client";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import type {
  CalendarEventRow,
  GoalRow,
  GradeRow,
  ReviewRow,
  StudySessionRow,
  TopicRow,
} from "@/lib/db/schema";
import {
  TRASH_LABELS,
  TRASH_RETENTION_MS,
  TRASH_TABLES,
  type TrashTable,
} from "@/lib/trash/retention";

function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number): Date {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hasTopicContent(content: unknown): boolean {
  if (!content || typeof content !== "object") return false;
  const c = content as { content?: Array<{ content?: unknown[] }> };
  if (!Array.isArray(c.content) || c.content.length === 0) return false;
  return c.content.some((n) => Array.isArray(n.content) && n.content.length > 0);
}

/** Remove itens na Lixeira (trashedAt != null). Aplicado em TODOS os reads de
 * listagem pra itens excluídos não vazarem ("fantasmas") nas telas. */
function live<T extends { trashedAt?: number | null }>(rows: T[]): T[] {
  return rows.filter((r) => r.trashedAt == null);
}

async function userSubjects(userId: string) {
  return live(await db().subjects.where("userId").equals(userId).toArray());
}
async function userSessions(userId: string) {
  return live(await db().sessions.where("userId").equals(userId).toArray());
}

// ─── Subjects ──────────────────────────────────────────────────────────────

export async function getSubjectsForUser() {
  const userId = getCurrentUserId();
  const subjects = (await userSubjects(userId)).filter((s) => !s.archived);
  subjects.sort((a, b) => b.updatedAt - a.updatedAt);

  const allSessions = await userSessions(userId);
  return subjects.map((s) => {
    const sessions = allSessions.filter((x) => x.subjectId === s.id);
    return {
      id: s.id,
      name: s.name,
      color: s.color,
      icon: s.icon ?? null,
      priority: s.priority.toLowerCase() as "low" | "medium" | "high",
      progress: s.progress,
      tags: s.tags,
      totalSeconds: sessions.reduce((a, x) => a + x.durationSeconds, 0),
      sessionCount: sessions.length,
    };
  });
}
export type SubjectView = Awaited<ReturnType<typeof getSubjectsForUser>>[number];

// ─── Topic tree ────────────────────────────────────────────────────────────

export type TopicNode = {
  id: string;
  title: string;
  hasContent: boolean;
  order: number;
  updatedAt: Date;
  descendantCount: number;
  children: TopicNode[];
};

function buildTopicTree(topics: TopicRow[], rootParentId: string | null): TopicNode[] {
  const byParent = new Map<string | null, TopicRow[]>();
  for (const t of topics) {
    const k = t.parentId;
    const arr = byParent.get(k) ?? [];
    arr.push(t);
    byParent.set(k, arr);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }
  function build(parentId: string | null): TopicNode[] {
    const list = byParent.get(parentId) ?? [];
    return list.map((t) => {
      const children = build(t.id);
      const descendantCount =
        children.length + children.reduce((a, c) => a + c.descendantCount, 0);
      return {
        id: t.id,
        title: t.title,
        hasContent: hasTopicContent(t.content),
        order: t.order,
        updatedAt: new Date(t.updatedAt),
        descendantCount,
        children,
      };
    });
  }
  return build(rootParentId);
}

// ─── Subject detail ────────────────────────────────────────────────────────

export async function getSubjectDetail(subjectId: string) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(subjectId);
  if (!subject || subject.userId !== userId) return null;

  const [topicsRaw, sessionsRaw] = await Promise.all([
    db().topics.where("subjectId").equals(subjectId).toArray(),
    db().sessions.where("subjectId").equals(subjectId).toArray(),
  ]);
  const topics = live(topicsRaw);
  const allSessions = live(sessionsRaw);

  const tree = buildTopicTree(topics, null);
  const recent = [...allSessions]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10);

  return {
    subject: {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      icon: subject.icon ?? null,
      priority: subject.priority.toLowerCase() as "low" | "medium" | "high",
      progress: subject.progress,
      tags: subject.tags,
      archived: subject.archived,
    },
    topics: tree,
    topicCount: topics.length,
    totalSeconds: allSessions.reduce((a, s) => a + s.durationSeconds, 0),
    sessionCount: allSessions.length,
    recentSessions: recent.map((s) => ({
      id: s.id,
      mode: s.mode.toLowerCase() as "pomodoro" | "free" | "reverse" | "custom",
      startedAt: new Date(s.startedAt),
      durationSeconds: s.durationSeconds,
      focusScore: s.focusScore ?? null,
    })),
  };
}
export type SubjectDetail = Awaited<ReturnType<typeof getSubjectDetail>>;

// ─── Topic detail ──────────────────────────────────────────────────────────

export async function getTopicDetail(topicId: string) {
  const userId = getCurrentUserId();
  const topic = await db().topics.get(topicId);
  if (!topic) return null;
  const subject = await db().subjects.get(topic.subjectId);
  if (!subject || subject.userId !== userId) return null;

  const ancestors: { id: string; title: string }[] = [];
  let cursor: TopicRow | undefined = topic;
  while (cursor && cursor.parentId) {
    const parent: TopicRow | undefined = await db().topics.get(cursor.parentId);
    if (!parent) break;
    ancestors.unshift({ id: parent.id, title: parent.title });
    cursor = parent;
  }

  const [allTopicsRaw, sessionsRaw] = await Promise.all([
    db().topics.where("subjectId").equals(topic.subjectId).toArray(),
    db().sessions.where("topicId").equals(topic.id).toArray(),
  ]);
  const allTopicsOfSubject = live(allTopicsRaw);
  const sessions = live(sessionsRaw);

  const children = buildTopicTree(allTopicsOfSubject, topic.id);
  const descendantCount =
    children.length + children.reduce((a, c) => a + c.descendantCount, 0);

  const recent = [...sessions]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10);

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      order: topic.order,
    },
    subject: { id: subject.id, name: subject.name, color: subject.color },
    ancestors,
    children,
    descendantCount,
    totalSeconds: sessions.reduce((a, s) => a + s.durationSeconds, 0),
    sessionCount: sessions.length,
    recentSessions: recent.map((s) => ({
      id: s.id,
      mode: s.mode.toLowerCase() as "pomodoro" | "free" | "reverse" | "custom",
      startedAt: new Date(s.startedAt),
      durationSeconds: s.durationSeconds,
    })),
  };
}
export type TopicDetail = Awaited<ReturnType<typeof getTopicDetail>>;

// ─── Goals ─────────────────────────────────────────────────────────────────

export async function getGoalsWithProgress() {
  const userId = getCurrentUserId();
  const [goalsRaw, sessions] = await Promise.all([
    db().goals.where("userId").equals(userId).toArray(),
    userSessions(userId),
  ]);
  const goals = live(goalsRaw);
  goals.sort((a, b) => (a.active === b.active ? a.createdAt - b.createdAt : a.active ? -1 : 1));

  const today = startOfDay().getTime();
  const weekStart = daysAgo(6).getTime();
  const monthStart = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const todaySess = sessions.filter((s) => s.startedAt >= today);
  const weekSess = sessions.filter((s) => s.startedAt >= weekStart);
  const monthSess = sessions.filter((s) => s.startedAt >= monthStart);

  function bucket(g: GoalRow): number {
    const list =
      g.type === "DAILY" ? todaySess : g.type === "WEEKLY" ? weekSess : monthSess;
    if (g.metric === "HOURS") return list.reduce((a, s) => a + s.durationSeconds, 0) / 3600;
    if (g.metric === "SESSIONS") return list.length;
    return 0;
  }

  return goals.map((g) => {
    const current = +bucket(g).toFixed(2);
    return {
      id: g.id,
      label: g.label,
      type: g.type.toLowerCase() as "daily" | "weekly" | "monthly",
      metric: g.metric.toLowerCase() as
        | "hours"
        | "tasks"
        | "sessions"
        | "reviews",
      target: g.target,
      current,
      active: g.active,
      progress: Math.min(100, (current / g.target) * 100),
    };
  });
}
export type GoalView = Awaited<ReturnType<typeof getGoalsWithProgress>>[number];

// ─── Reviews ──────────────────────────────────────────────────────────────

export async function getReviewsForUser() {
  const userId = getCurrentUserId();
  const [reviewsRaw, subjects] = await Promise.all([
    db().reviews.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const pending = live(reviewsRaw).filter((r) => r.status === "PENDING");
  pending.sort((a, b) => a.scheduledAt - b.scheduledAt);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const today = startOfDay().getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;

  function toView(r: ReviewRow) {
    const subj = r.subjectId ? subjectMap.get(r.subjectId) : undefined;
    return {
      id: r.id,
      title: r.title,
      subjectName: subj?.name ?? null,
      subjectColor: subj?.color ?? null,
      scheduledAt: new Date(r.scheduledAt),
      interval: r.interval,
    };
  }
  return {
    overdue: pending.filter((r) => r.scheduledAt < today).map(toView),
    today: pending
      .filter((r) => r.scheduledAt >= today && r.scheduledAt < tomorrow)
      .map(toView),
    upcoming: pending.filter((r) => r.scheduledAt >= tomorrow).map(toView),
  };
}
export type ReviewsView = Awaited<ReturnType<typeof getReviewsForUser>>;

// ─── Flashcards ───────────────────────────────────────────────────────────

export async function getFlashcardDecks() {
  const userId = getCurrentUserId();
  const cards = live(await db().flashcards.where("userId").equals(userId).toArray());
  const now = Date.now();
  const map = new Map<string, { total: number; due: number }>();
  for (const c of cards) {
    const deck = c.deck ?? "Sem deck";
    const e = map.get(deck) ?? { total: 0, due: 0 };
    e.total += 1;
    if (c.nextReview <= now) e.due += 1;
    map.set(deck, e);
  }
  return Array.from(map.entries())
    .map(([deck, v]) => ({ deck, total: v.total, due: v.due }))
    .sort((a, b) => b.due - a.due || a.deck.localeCompare(b.deck));
}
export type DeckView = Awaited<ReturnType<typeof getFlashcardDecks>>[number];

export async function getDueFlashcards(deckName?: string) {
  const userId = getCurrentUserId();
  const now = Date.now();
  let cards = live(await db().flashcards.where("userId").equals(userId).toArray());
  cards = cards.filter((c) => c.nextReview <= now);
  if (deckName) cards = cards.filter((c) => c.deck === deckName);

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  cards = cards.slice(0, 50);

  return cards.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
    deck: c.deck,
    ease: c.ease,
    interval: c.interval,
  }));
}
export type DueCard = Awaited<ReturnType<typeof getDueFlashcards>>[number];

// ─── Events ───────────────────────────────────────────────────────────────

function eventToView(e: CalendarEventRow, subjects: Map<string, { id: string; name: string; color: string }>) {
  const subj = e.subjectId ? subjects.get(e.subjectId) : undefined;
  return {
    id: e.id,
    title: e.title,
    type: e.type.toLowerCase() as "exam" | "task" | "class" | "custom",
    date: new Date(e.date),
    done: e.done,
    notes: e.notes,
    subjectId: subj?.id ?? null,
    subjectName: subj?.name ?? null,
    subjectColor: subj?.color ?? null,
  };
}

export async function getEventsForRange(start: Date, end: Date) {
  const userId = getCurrentUserId();
  const [eventsRaw, subjects] = await Promise.all([
    db().events.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const events = live(eventsRaw);
  const subjMap = new Map(
    subjects.map((s) => [s.id, { id: s.id, name: s.name, color: s.color }])
  );
  return events
    .filter((e) => e.date >= start.getTime() && e.date < end.getTime())
    .sort((a, b) => a.date - b.date)
    .map((e) => eventToView(e, subjMap));
}
export type EventView = Awaited<ReturnType<typeof getEventsForRange>>[number];

// ─── Grades ───────────────────────────────────────────────────────────────

function gradeToView(g: GradeRow, subjects: Map<string, { id: string; name: string; color: string }>) {
  const subj = subjects.get(g.subjectId);
  const percent = (g.score / g.maxScore) * 100;
  return {
    id: g.id,
    subjectId: g.subjectId,
    subjectName: subj?.name ?? "—",
    subjectColor: subj?.color ?? "#71717a",
    title: g.title,
    type: g.type.toLowerCase() as "exam" | "assignment" | "quiz" | "other",
    score: g.score,
    maxScore: g.maxScore,
    weight: g.weight,
    date: new Date(g.date),
    comments: g.comments,
    percent,
  };
}

function weightedAverage(grades: { score: number; maxScore: number; weight: number }[]) {
  if (grades.length === 0) return null;
  const tw = grades.reduce((a, g) => a + g.weight, 0);
  if (tw === 0) return null;
  return grades.reduce((a, g) => a + (g.score / g.maxScore) * 10 * g.weight, 0) / tw;
}

export async function getGradesForUser() {
  const userId = getCurrentUserId();
  const [gradesRaw, subjects] = await Promise.all([
    db().grades.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const grades = live(gradesRaw);
  grades.sort((a, b) => b.date - a.date);
  const subjMap = new Map(subjects.map((s) => [s.id, { id: s.id, name: s.name, color: s.color }]));
  return grades.map((g) => gradeToView(g, subjMap));
}
export type GradeView = ReturnType<typeof gradeToView>;

export async function getGradesForSubject(subjectId: string) {
  const userId = getCurrentUserId();
  const subject = await db().subjects.get(subjectId);
  if (!subject || subject.userId !== userId) return { grades: [], average: null };
  const grades = live(await db().grades.where("subjectId").equals(subjectId).toArray());
  grades.sort((a, b) => b.date - a.date);
  const subjMap = new Map([[subject.id, { id: subject.id, name: subject.name, color: subject.color }]]);
  return {
    grades: grades.map((g) => gradeToView(g, subjMap)),
    average: weightedAverage(grades),
  };
}

export async function getGradesSummary() {
  const userId = getCurrentUserId();
  const [gradesRaw, subjects] = await Promise.all([
    db().grades.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const grades = live(gradesRaw);
  const subjMap = new Map(subjects.map((s) => [s.id, { id: s.id, name: s.name, color: s.color }]));

  const byMap = new Map<string, GradeRow[]>();
  for (const s of subjects.filter((s) => !s.archived)) byMap.set(s.id, []);
  for (const g of grades) {
    const arr = byMap.get(g.subjectId);
    if (arr) arr.push(g);
  }
  const bySubject = Array.from(byMap.entries())
    .map(([sid, gs]) => {
      const s = subjMap.get(sid)!;
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        count: gs.length,
        average: weightedAverage(gs),
      };
    })
    .sort((a, b) => {
      if (a.count === 0 && b.count > 0) return 1;
      if (b.count === 0 && a.count > 0) return -1;
      return (b.average ?? 0) - (a.average ?? 0);
    });

  return {
    totalGrades: grades.length,
    overallAverage: weightedAverage(grades),
    bySubject,
    recent: [...grades]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map((g) => gradeToView(g, subjMap)),
  };
}
export type GradesSummary = Awaited<ReturnType<typeof getGradesSummary>>;

// ─── Profile ──────────────────────────────────────────────────────────────

export async function getProfileSummary() {
  const userId = getCurrentUserId();
  const user = await db().users.get(userId);
  const [subjects, sessions, flashcardsRaw] = await Promise.all([
    userSubjects(userId),
    userSessions(userId),
    db().flashcards.where("userId").equals(userId).toArray(),
  ]);
  const flashcards = live(flashcardsRaw);
  return {
    name: user?.name ?? "Você",
    email: user?.email ?? "—",
    subjectCount: subjects.filter((s) => !s.archived).length,
    sessionCount: sessions.length,
    flashcardCount: flashcards.length,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────

export async function getDashboardData() {
  const userId = getCurrentUserId();
  const today = startOfDay().getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;
  const weekStart = daysAgo(6).getTime();
  const heatmapStart = daysAgo(89).getTime();
  const now = Date.now();

  const [subjects, allSessions, goalsRaw, reviewsRaw, flashcardsRaw] = await Promise.all([
    userSubjects(userId),
    userSessions(userId),
    db().goals.where("userId").equals(userId).toArray(),
    db().reviews.where("userId").equals(userId).toArray(),
    db().flashcards.where("userId").equals(userId).toArray(),
  ]);
  const goals = live(goalsRaw);
  const reviews = live(reviewsRaw);
  const flashcards = live(flashcardsRaw);

  const activeSubjects = subjects.filter((s) => !s.archived);
  activeSubjects.sort((a, b) => b.updatedAt - a.updatedAt);

  const todaySessions = allSessions.filter((s) => s.startedAt >= today);
  const weekSessions = allSessions.filter((s) => s.startedAt >= weekStart);
  const recentSessions = [...allSessions]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 6);
  const heatmapSessions = allSessions.filter((s) => s.startedAt >= heatmapStart);

  const subjectsView = activeSubjects.slice(0, 6).map((s) => {
    const ss = allSessions.filter((x) => x.subjectId === s.id);
    return {
      id: s.id,
      name: s.name,
      color: s.color,
      progress: s.progress,
      totalSeconds: ss.reduce((a, x) => a + x.durationSeconds, 0),
    };
  });

  const todaySeconds = todaySessions.reduce((a, s) => a + s.durationSeconds, 0);
  const focusScores = todaySessions
    .map((s) => s.focusScore)
    .filter((x): x is number => x != null);
  const focusAvg =
    focusScores.length > 0
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : 0;
  const weekSeconds = weekSessions.reduce((a, s) => a + s.durationSeconds, 0);

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    const dStart = d.getTime();
    const dEnd = dStart + 24 * 60 * 60 * 1000;
    const sec = weekSessions
      .filter((s) => s.startedAt >= dStart && s.startedAt < dEnd)
      .reduce((a, s) => a + s.durationSeconds, 0);
    return { day: dayLabels[d.getDay()], hours: +(sec / 3600).toFixed(1) };
  });

  const heatmapMap = new Map<string, number>();
  heatmapSessions.forEach((s) => {
    const key = dayKey(new Date(s.startedAt));
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + s.durationSeconds);
  });
  const heatmap = Array.from({ length: 90 }, (_, i) => {
    const d = daysAgo(89 - i);
    const key = dayKey(d);
    return { date: key, seconds: heatmapMap.get(key) ?? 0 };
  });
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].seconds > 0) streak++;
    else break;
  }

  const sessionsView = recentSessions.map((s) => {
    const subj = activeSubjects.find((x) => x.id === s.subjectId);
    return {
      id: s.id,
      subjectId: s.subjectId ?? "—",
      subjectName: subj?.name ?? "Sem matéria",
      subjectColor: subj?.color ?? "#71717a",
      startedAt: new Date(s.startedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : null,
      durationSeconds: s.durationSeconds,
      mode: s.mode.toLowerCase() as "pomodoro" | "free" | "reverse" | "custom",
    };
  });

  const goalsView = goals
    .filter((g) => g.active)
    .map((g) => {
      let current = 0;
      if (g.type === "DAILY") {
        if (g.metric === "HOURS") current = +(todaySeconds / 3600).toFixed(2);
        else if (g.metric === "SESSIONS") current = todaySessions.length;
      } else if (g.type === "WEEKLY") {
        if (g.metric === "HOURS") current = +(weekSeconds / 3600).toFixed(2);
        else if (g.metric === "SESSIONS") current = weekSessions.length;
      }
      return {
        id: g.id,
        label: g.label,
        target: g.target,
        current,
        type: g.type.toLowerCase() as "daily" | "weekly" | "monthly",
        metric: g.metric.toLowerCase() as
          | "hours"
          | "tasks"
          | "sessions"
          | "reviews",
      };
    });

  const reviewsToday = reviews.filter(
    (r) => r.status === "PENDING" && r.scheduledAt < tomorrow
  ).length;
  const flashcardsDue = flashcards.filter((c) => c.nextReview <= now).length;

  return {
    today: {
      studiedSeconds: todaySeconds,
      sessions: todaySessions.length,
      focusPercentage: focusAvg,
      streak,
    },
    week: { studiedSeconds: weekSeconds },
    reviews: { today: reviewsToday, flashcardsDue },
    subjects: subjectsView,
    goals: goalsView,
    sessions: sessionsView,
    weekly: last7,
    heatmap,
  };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

// ─── Stats ────────────────────────────────────────────────────────────────

export async function getStatsForPeriod(periodDays: number) {
  const userId = getCurrentUserId();
  const since = daysAgo(periodDays - 1).getTime();
  const all = await userSessions(userId);
  const sessions = all.filter((s) => s.startedAt >= since);
  const subjects = await userSubjects(userId);
  const subjMap = new Map(subjects.map((s) => [s.id, s]));

  const totalSeconds = sessions.reduce((a, s) => a + s.durationSeconds, 0);
  const focusScores = sessions
    .map((s) => s.focusScore)
    .filter((x): x is number => x != null);
  const focusAvg =
    focusScores.length > 0
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : 0;
  const activeDaysSet = new Set(sessions.map((s) => dayKey(new Date(s.startedAt))));
  const avgPerActiveDay = activeDaysSet.size > 0 ? totalSeconds / 3600 / activeDaysSet.size : 0;

  const dayHoursMap = new Map<string, number>();
  sessions.forEach((s) => {
    const key = dayKey(new Date(s.startedAt));
    dayHoursMap.set(key, (dayHoursMap.get(key) ?? 0) + s.durationSeconds);
  });
  let bestDay: { date: string; hours: number } | null = null;
  for (const [date, secs] of dayHoursMap) {
    const hours = secs / 3600;
    if (!bestDay || hours > bestDay.hours) bestDay = { date, hours };
  }

  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const byWeekday = weekdayLabels.map((label) => ({ label, hours: 0 }));
  sessions.forEach((s) => {
    byWeekday[new Date(s.startedAt).getDay()].hours += s.durationSeconds / 3600;
  });
  byWeekday.forEach((d) => (d.hours = +d.hours.toFixed(2)));

  const subjectAgg = new Map<string, number>();
  sessions.forEach((s) => {
    const k = s.subjectId ?? "_none";
    subjectAgg.set(k, (subjectAgg.get(k) ?? 0) + s.durationSeconds);
  });
  const bySubject = Array.from(subjectAgg.entries())
    .map(([sid, secs]) => {
      const s = subjMap.get(sid);
      return {
        id: sid,
        name: s?.name ?? "Sem matéria",
        color: s?.color ?? "#71717a",
        hours: +(secs / 3600).toFixed(2),
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const modeLabels: Record<string, { label: string; color: string }> = {
    POMODORO: { label: "Pomodoro", color: "#a78bfa" },
    FREE: { label: "Livre", color: "#60a5fa" },
    REVERSE: { label: "Reverso", color: "#fbbf24" },
    CUSTOM: { label: "Custom", color: "#34d399" },
  };
  const modeAgg = new Map<string, { secs: number; count: number }>();
  sessions.forEach((s) => {
    const e = modeAgg.get(s.mode) ?? { secs: 0, count: 0 };
    e.secs += s.durationSeconds;
    e.count += 1;
    modeAgg.set(s.mode, e);
  });
  const byMode = Array.from(modeAgg.entries())
    .map(([mode, v]) => ({
      mode,
      label: modeLabels[mode]?.label ?? mode,
      color: modeLabels[mode]?.color ?? "#94a3b8",
      hours: +(v.secs / 3600).toFixed(2),
      sessions: v.count,
    }))
    .sort((a, b) => b.hours - a.hours);

  return {
    period: periodDays,
    totalSeconds,
    sessionCount: sessions.length,
    activeDays: activeDaysSet.size,
    focusAvg,
    avgPerActiveDay: +avgPerActiveDay.toFixed(2),
    bestDay,
    byWeekday,
    bySubject,
    byMode,
  };
}
export type StatsView = Awaited<ReturnType<typeof getStatsForPeriod>>;

export async function getContentStatsForPeriod(periodDays: number) {
  const userId = getCurrentUserId();
  const since = daysAgo(periodDays - 1).getTime();
  const subjects = await userSubjects(userId);
  const subjectIds = new Set(subjects.map((s) => s.id));
  const allTopics = live(await db().topics.toArray());
  const userTopics = allTopics.filter((t) => subjectIds.has(t.subjectId));
  const topicsTouched = userTopics.filter((t) => t.updatedAt >= since).length;
  const topicsWithContent = userTopics.filter((t) => hasTopicContent(t.content)).length;

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const writingByDay = Array.from({ length: periodDays }, (_, i) => {
    const d = daysAgo(periodDays - 1 - i);
    return {
      date: dayKey(d),
      label: dayLabels[d.getDay()],
      edits: 0,
    };
  });
  const byDate = new Map(writingByDay.map((d) => [d.date, d]));
  for (const t of userTopics) {
    if (t.updatedAt < since) continue;
    const k = dayKey(new Date(t.updatedAt));
    const slot = byDate.get(k);
    if (slot) slot.edits += 1;
  }

  return {
    totalTopics: userTopics.length,
    topicsWithContent,
    topicsTouched,
    writingByDay,
  };
}
export type ContentStats = Awaited<ReturnType<typeof getContentStatsForPeriod>>;

// ─── Calendar ─────────────────────────────────────────────────────────────

export async function getCalendarMonth(year: number, month: number) {
  const userId = getCurrentUserId();
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const monthEnd = new Date(year, month + 1, 1, 0, 0, 0, 0).getTime();

  const [allSessions, reviewsRaw, eventsRaw, subjects] = await Promise.all([
    userSessions(userId),
    db().reviews.where("userId").equals(userId).toArray(),
    db().events.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const reviews = live(reviewsRaw);
  const events = live(eventsRaw);
  const subjMap = new Map(
    subjects.map((s) => [s.id, { id: s.id, name: s.name, color: s.color }])
  );

  const sessions = allSessions
    .filter((s) => s.startedAt >= monthStart && s.startedAt < monthEnd)
    .map((s) => {
      const subj = s.subjectId ? subjMap.get(s.subjectId) : undefined;
      return {
        id: s.id,
        startedAt: new Date(s.startedAt),
        durationSeconds: s.durationSeconds,
        mode: s.mode.toLowerCase() as "pomodoro" | "free" | "reverse" | "custom",
        subjectName: subj?.name ?? null,
        subjectColor: subj?.color ?? null,
      };
    });

  const reviewsView = reviews
    .filter((r) => r.scheduledAt >= monthStart && r.scheduledAt < monthEnd)
    .map((r) => {
      const subj = r.subjectId ? subjMap.get(r.subjectId) : undefined;
      return {
        id: r.id,
        title: r.title,
        status: r.status.toLowerCase() as "pending" | "completed" | "skipped",
        scheduledAt: new Date(r.scheduledAt),
        subjectName: subj?.name ?? null,
        subjectColor: subj?.color ?? null,
      };
    });

  const eventsView = events
    .filter((e) => e.date >= monthStart && e.date < monthEnd)
    .sort((a, b) => a.date - b.date)
    .map((e) => eventToView(e, subjMap));

  type DayCell = {
    key: string;
    date: Date;
    seconds: number;
    sessions: typeof sessions;
    reviews: typeof reviewsView;
    events: typeof eventsView;
  };

  const days: DayCell[] = [];
  const cursor = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  while (cursor < end) {
    days.push({
      key: dayKey(cursor),
      date: new Date(cursor),
      seconds: 0,
      sessions: [],
      reviews: [],
      events: [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  sessions.forEach((s) => {
    const cell = byKey.get(dayKey(s.startedAt));
    if (cell) {
      cell.seconds += s.durationSeconds;
      cell.sessions.push(s);
    }
  });
  reviewsView.forEach((r) => {
    const cell = byKey.get(dayKey(r.scheduledAt));
    if (cell) cell.reviews.push(r);
  });
  eventsView.forEach((e) => {
    const cell = byKey.get(dayKey(e.date));
    if (cell) cell.events.push(e);
  });

  return {
    year,
    month,
    monthStart: new Date(year, month, 1),
    days,
    totalSeconds: days.reduce((a, d) => a + d.seconds, 0),
    activeDays: days.filter((d) => d.seconds > 0).length,
    sessionCount: sessions.length,
    reviewCount: reviewsView.length,
    eventCount: eventsView.length,
  };
}
export type CalendarMonth = Awaited<ReturnType<typeof getCalendarMonth>>;

export type StudySessionView = StudySessionRow;

// ─── Mapas mentais ───────────────────────────────────────────────────────────

export async function getMindMapsForUser() {
  const userId = getCurrentUserId();
  const maps = live(await db().mindmaps.where("userId").equals(userId).toArray());
  maps.sort((a, b) => b.updatedAt - a.updatedAt);
  return maps.map((m) => {
    const nodes = m.data?.nodes ?? [];
    return {
      id: m.id,
      title: m.title,
      subjectId: m.subjectId,
      nodeCount: nodes.length,
      slideCount: nodes.filter((n) => n.kind === "slide").length,
      updatedAt: m.updatedAt,
    };
  });
}
export type MindMapListItem = Awaited<
  ReturnType<typeof getMindMapsForUser>
>[number];

export async function getMindMap(id: string) {
  const userId = getCurrentUserId();
  const map = await db().mindmaps.get(id);
  if (!map || map.userId !== userId) return null;
  return map;
}

// ─── Atividades / redações ───────────────────────────────────────────────────

export async function getActivitiesForUser() {
  const userId = getCurrentUserId();
  const [actsRaw, subjects] = await Promise.all([
    db().activities.where("userId").equals(userId).toArray(),
    userSubjects(userId),
  ]);
  const acts = live(actsRaw);
  const subjMap = new Map(subjects.map((s) => [s.id, { name: s.name, color: s.color }]));
  return acts
    .sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt)
    .map((a) => {
      const subj = a.subjectId ? subjMap.get(a.subjectId) : undefined;
      return {
        id: a.id,
        title: a.title,
        type: a.type,
        status: a.status,
        subjectId: a.subjectId,
        subjectName: subj?.name ?? null,
        subjectColor: subj?.color ?? null,
        dueDate: a.dueDate,
        grade: a.grade,
        maxGrade: a.maxGrade,
        order: a.order,
        updatedAt: a.updatedAt,
      };
    });
}
export type ActivityListItem = Awaited<
  ReturnType<typeof getActivitiesForUser>
>[number];

export async function getActivity(id: string) {
  const userId = getCurrentUserId();
  const a = await db().activities.get(id);
  if (!a || a.userId !== userId) return null;
  return a;
}

// ─── Projetos (Kanban) ───────────────────────────────────────────────────────

export async function getBoardsForUser() {
  const userId = getCurrentUserId();
  const [boardsRaw, cardsRaw] = await Promise.all([
    db().boards.where("userId").equals(userId).toArray(),
    db().cards.where("userId").equals(userId).toArray(),
  ]);
  const boards = live(boardsRaw);
  const cards = live(cardsRaw);
  boards.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    color: b.color,
    columns: b.columns,
    order: b.order,
    cardCount: cards.filter((c) => c.boardId === b.id).length,
  }));
}
export type BoardListItem = Awaited<ReturnType<typeof getBoardsForUser>>[number];

export async function getBoardDetail(boardId: string) {
  const userId = getCurrentUserId();
  const board = await db().boards.get(boardId);
  if (!board || board.userId !== userId || board.trashedAt != null) return null;
  const cards = live(
    await db().cards.where("boardId").equals(boardId).toArray()
  );
  cards.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  return {
    board: {
      id: board.id,
      name: board.name,
      color: board.color,
      columns: board.columns,
    },
    cards: cards.map((c) => ({
      id: c.id,
      boardId: c.boardId,
      columnId: c.columnId,
      title: c.title,
      labels: c.labels ?? [],
      priority: c.priority,
      color: c.color ?? null,
      dueDate: c.dueDate,
      order: c.order,
      hasContent: hasTopicContent(c.content),
    })),
  };
}
export type BoardDetail = NonNullable<Awaited<ReturnType<typeof getBoardDetail>>>;
export type CardListItem = BoardDetail["cards"][number];

export async function getCard(id: string) {
  const userId = getCurrentUserId();
  const c = await db().cards.get(id);
  if (!c || c.userId !== userId) return null;
  return c;
}

// ─── Bloco de notas ──────────────────────────────────────────────────────────

/** Extrai um trecho de texto puro do JSON do TipTap (pra prévia do card). */
function extractPlainText(content: unknown, limit = 140): string {
  if (!content || typeof content !== "object") return "";
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (parts.join(" ").length > limit) return;
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(content);
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, limit);
}

export async function getNotesForUser() {
  const userId = getCurrentUserId();
  const notes = live(await db().notes.where("userId").equals(userId).toArray());
  notes.sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
  );
  return notes.map((n) => ({
    id: n.id,
    title: n.title,
    preview: extractPlainText(n.content),
    pinned: n.pinned,
    color: n.color,
    updatedAt: n.updatedAt,
  }));
}
export type NoteListItem = Awaited<ReturnType<typeof getNotesForUser>>[number];

export async function getNote(id: string) {
  const userId = getCurrentUserId();
  const n = await db().notes.get(id);
  if (!n || n.userId !== userId) return null;
  return n;
}

// ─── Lixeira ──────────────────────────────────────────────────────────────

export type TrashEntry = {
  table: TrashTable;
  id: string;
  title: string;
  typeLabel: string;
};

/**
 * Grupo da Lixeira: itens excluídos numa mesma ação (mesmo `trashedAt` ms) —
 * ex.: um tópico + descendentes, ou uma atividade + seu evento no calendário.
 */
export type TrashGroup = {
  stamp: number;
  trashedAt: Date;
  expiresAt: Date;
  title: string;
  typeLabel: string;
  count: number;
  items: TrashEntry[];
};

function ref(name: TrashTable) {
  return (
    db() as unknown as Record<
      string,
      { where: (k: string) => { equals: (v: string) => { toArray: () => Promise<Record<string, unknown>[]> } } }
    >
  )[name];
}

/** Lista os itens na Lixeira do usuário, agrupados por ação (stamp). */
export async function getTrashItems(): Promise<TrashGroup[]> {
  const userId = getCurrentUserId();
  const byStamp = new Map<number, TrashEntry[]>();

  for (const table of TRASH_TABLES) {
    const rows = await ref(table).where("userId").equals(userId).toArray();
    const cfg = TRASH_LABELS[table];
    for (const r of rows) {
      const stamp = r.trashedAt as number | null | undefined;
      if (stamp == null) continue;
      const arr = byStamp.get(stamp) ?? [];
      arr.push({
        table,
        id: String(r.id),
        title: cfg.title(r),
        typeLabel: cfg.label,
      });
      byStamp.set(stamp, arr);
    }
  }

  const groups: TrashGroup[] = Array.from(byStamp.entries()).map(
    ([stamp, items]) => {
      // Item "principal" do grupo: o de maior peso (matéria/atividade antes de
      // sessões/eventos-espelho); fallback = o primeiro.
      const primary = items.find((i) => i.table !== "sessions" && i.table !== "events") ?? items[0];
      return {
        stamp,
        trashedAt: new Date(stamp),
        expiresAt: new Date(stamp + TRASH_RETENTION_MS),
        title: primary.title,
        typeLabel: primary.typeLabel,
        count: items.length,
        items,
      };
    }
  );
  groups.sort((a, b) => b.stamp - a.stamp);
  return groups;
}

/** Quantidade de itens na Lixeira (pro badge da navegação). */
export async function getTrashCount(): Promise<number> {
  const userId = getCurrentUserId();
  let count = 0;
  for (const table of TRASH_TABLES) {
    const rows = await ref(table).where("userId").equals(userId).toArray();
    count += rows.filter((r) => r.trashedAt != null).length;
  }
  return count;
}
