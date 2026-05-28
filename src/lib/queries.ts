import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

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

export async function getDashboardData() {
  const userId = await getCurrentUserId();

  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = daysAgo(6);
  const heatmapStart = daysAgo(89);
  const now = new Date();

  const [
    subjects,
    goals,
    todaySessions,
    weekSessions,
    recentSessions,
    heatmapSessions,
    reviewsToday,
    flashcardsDue,
  ] = await Promise.all([
    prisma.subject.findMany({
      where: { userId, archived: false },
      orderBy: { updatedAt: "desc" },
      include: {
        sessions: { select: { durationSeconds: true } },
      },
      take: 6,
    }),
    prisma.goal.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: today } },
      select: { durationSeconds: true, focusScore: true },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: weekStart } },
      select: { durationSeconds: true, startedAt: true },
    }),
    prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 6,
      include: {
        subject: { select: { name: true, color: true } },
      },
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: heatmapStart } },
      select: { durationSeconds: true, startedAt: true },
    }),
    prisma.review.count({
      where: {
        userId,
        status: "PENDING",
        scheduledAt: { lt: tomorrow },
      },
    }),
    prisma.flashcard.count({
      where: { userId, nextReview: { lte: now } },
    }),
  ]);

  const subjectsView = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    progress: s.progress,
    totalSeconds: s.sessions.reduce((acc, x) => acc + x.durationSeconds, 0),
  }));

  const todaySeconds = todaySessions.reduce(
    (acc, s) => acc + s.durationSeconds,
    0
  );
  const focusScores = todaySessions
    .map((s) => s.focusScore)
    .filter((x): x is number => x != null);
  const focusAvg =
    focusScores.length > 0
      ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      : 0;

  const weekSeconds = weekSessions.reduce(
    (acc, s) => acc + s.durationSeconds,
    0
  );

  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    const seconds = weekSessions
      .filter((s) => {
        const sd = new Date(s.startedAt);
        return (
          sd.getFullYear() === d.getFullYear() &&
          sd.getMonth() === d.getMonth() &&
          sd.getDate() === d.getDate()
        );
      })
      .reduce((acc, s) => acc + s.durationSeconds, 0);
    return {
      day: dayLabels[d.getDay()],
      hours: +(seconds / 3600).toFixed(1),
    };
  });

  const heatmapMap = new Map<string, number>();
  heatmapSessions.forEach((s) => {
    const key = new Date(s.startedAt).toISOString().slice(0, 10);
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + s.durationSeconds);
  });
  const heatmap = Array.from({ length: 90 }, (_, i) => {
    const d = daysAgo(89 - i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, seconds: heatmapMap.get(key) ?? 0 };
  });

  const streak = computeStreak(heatmap);

  const sessionsView = recentSessions.map((s) => ({
    id: s.id,
    subjectId: s.subjectId ?? "—",
    subjectName: s.subject?.name ?? "Sem matéria",
    subjectColor: s.subject?.color ?? "#71717a",
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSeconds: s.durationSeconds,
    mode: s.mode.toLowerCase() as "pomodoro" | "free" | "reverse" | "custom",
  }));

  const goalsView = goals.map((g) => {
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

  return {
    today: {
      studiedSeconds: todaySeconds,
      sessions: todaySessions.length,
      focusPercentage: focusAvg,
      streak,
    },
    week: {
      studiedSeconds: weekSeconds,
    },
    reviews: {
      today: reviewsToday,
      flashcardsDue,
    },
    subjects: subjectsView,
    goals: goalsView,
    sessions: sessionsView,
    weekly: last7,
    heatmap,
  };
}

function computeStreak(heatmap: { date: string; seconds: number }[]): number {
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].seconds > 0) streak++;
    else break;
  }
  return streak;
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getSubjectsForUser() {
  const userId = await getCurrentUserId();
  const subjects = await prisma.subject.findMany({
    where: { userId, archived: false },
    orderBy: { updatedAt: "desc" },
    include: {
      sessions: { select: { durationSeconds: true } },
    },
  });
  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    priority: s.priority.toLowerCase() as "low" | "medium" | "high",
    progress: s.progress,
    tags: s.tags,
    totalSeconds: s.sessions.reduce((acc, x) => acc + x.durationSeconds, 0),
    sessionCount: s.sessions.length,
  }));
}

export type SubjectView = Awaited<ReturnType<typeof getSubjectsForUser>>[number];

export async function getGoalsWithProgress() {
  const userId = await getCurrentUserId();

  const today = startOfDay();
  const weekStart = daysAgo(6);
  const monthStart = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const [goals, todaySessions, weekSessions, monthSessions] = await Promise.all(
    [
      prisma.goal.findMany({
        where: { userId },
        orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      }),
      prisma.studySession.findMany({
        where: { userId, startedAt: { gte: today } },
        select: { durationSeconds: true },
      }),
      prisma.studySession.findMany({
        where: { userId, startedAt: { gte: weekStart } },
        select: { durationSeconds: true },
      }),
      prisma.studySession.findMany({
        where: { userId, startedAt: { gte: monthStart } },
        select: { durationSeconds: true },
      }),
    ]
  );

  const buckets = {
    daily: {
      hours: todaySessions.reduce((a, s) => a + s.durationSeconds, 0) / 3600,
      sessions: todaySessions.length,
      tasks: 0,
      reviews: 0,
    },
    weekly: {
      hours: weekSessions.reduce((a, s) => a + s.durationSeconds, 0) / 3600,
      sessions: weekSessions.length,
      tasks: 0,
      reviews: 0,
    },
    monthly: {
      hours: monthSessions.reduce((a, s) => a + s.durationSeconds, 0) / 3600,
      sessions: monthSessions.length,
      tasks: 0,
      reviews: 0,
    },
  } as const;

  return goals.map((g) => {
    const type = g.type.toLowerCase() as "daily" | "weekly" | "monthly";
    const metric = g.metric.toLowerCase() as
      | "hours"
      | "tasks"
      | "sessions"
      | "reviews";
    const current = +buckets[type][metric].toFixed(2);
    return {
      id: g.id,
      label: g.label,
      type,
      metric,
      target: g.target,
      current,
      active: g.active,
      progress: Math.min(100, (current / g.target) * 100),
    };
  });
}

export type GoalView = Awaited<ReturnType<typeof getGoalsWithProgress>>[number];

export async function getReviewsForUser() {
  const userId = await getCurrentUserId();

  const today = startOfDay();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const reviews = await prisma.review.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
    include: {
      subject: { select: { name: true, color: true } },
    },
    take: 100,
  });

  const view = reviews.map((r) => ({
    id: r.id,
    title: r.title,
    subjectName: r.subject?.name ?? null,
    subjectColor: r.subject?.color ?? null,
    scheduledAt: r.scheduledAt,
    interval: r.interval,
  }));

  const overdue = view.filter((r) => r.scheduledAt < today);
  const todayList = view.filter(
    (r) => r.scheduledAt >= today && r.scheduledAt < tomorrow
  );
  const upcoming = view.filter((r) => r.scheduledAt >= tomorrow);

  return { overdue, today: todayList, upcoming };
}

export type ReviewsView = Awaited<ReturnType<typeof getReviewsForUser>>;

export async function getFlashcardDecks() {
  const userId = await getCurrentUserId();
  const now = new Date();

  const cards = await prisma.flashcard.findMany({
    where: { userId },
    select: { deck: true, nextReview: true },
  });

  const map = new Map<string, { total: number; due: number }>();
  for (const c of cards) {
    const deck = c.deck ?? "Sem deck";
    const entry = map.get(deck) ?? { total: 0, due: 0 };
    entry.total += 1;
    if (c.nextReview <= now) entry.due += 1;
    map.set(deck, entry);
  }

  return Array.from(map.entries())
    .map(([deck, v]) => ({ deck, total: v.total, due: v.due }))
    .sort((a, b) => b.due - a.due || a.deck.localeCompare(b.deck));
}

export type DeckView = Awaited<ReturnType<typeof getFlashcardDecks>>[number];

export async function getDueFlashcards(deckName?: string) {
  const userId = await getCurrentUserId();
  const now = new Date();

  const cards = await prisma.flashcard.findMany({
    where: {
      userId,
      nextReview: { lte: now },
      ...(deckName ? { deck: deckName } : {}),
    },
    take: 50,
  });

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

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
