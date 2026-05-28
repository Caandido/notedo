import type {
  DayHeatmapEntry,
  Goal,
  StudySession,
  Subject,
} from "@/types";

export const mockSubjects: Subject[] = [
  {
    id: "s1",
    name: "Cálculo I",
    color: "#a78bfa",
    priority: "high",
    totalSeconds: 14 * 3600 + 32 * 60,
    progress: 62,
    tags: ["faculdade", "exatas"],
    createdAt: new Date(),
  },
  {
    id: "s2",
    name: "Algoritmos",
    color: "#60a5fa",
    priority: "high",
    totalSeconds: 22 * 3600 + 10 * 60,
    progress: 78,
    tags: ["programação"],
    createdAt: new Date(),
  },
  {
    id: "s3",
    name: "Inglês",
    color: "#34d399",
    priority: "medium",
    totalSeconds: 9 * 3600 + 5 * 60,
    progress: 40,
    tags: ["idiomas"],
    createdAt: new Date(),
  },
  {
    id: "s4",
    name: "Filosofia",
    color: "#fbbf24",
    priority: "low",
    totalSeconds: 3 * 3600 + 20 * 60,
    progress: 18,
    tags: ["humanas"],
    createdAt: new Date(),
  },
];

const now = new Date();

function hoursAgo(h: number) {
  const d = new Date(now);
  d.setHours(d.getHours() - h);
  return d;
}

export const mockSessions: StudySession[] = [
  {
    id: "ss1",
    subjectId: "s2",
    subjectName: "Algoritmos",
    subjectColor: "#60a5fa",
    startedAt: hoursAgo(2),
    endedAt: hoursAgo(1),
    durationSeconds: 55 * 60,
    mode: "pomodoro",
  },
  {
    id: "ss2",
    subjectId: "s1",
    subjectName: "Cálculo I",
    subjectColor: "#a78bfa",
    startedAt: hoursAgo(5),
    endedAt: hoursAgo(4),
    durationSeconds: 45 * 60,
    mode: "free",
  },
  {
    id: "ss3",
    subjectId: "s3",
    subjectName: "Inglês",
    subjectColor: "#34d399",
    startedAt: hoursAgo(8),
    endedAt: hoursAgo(7),
    durationSeconds: 30 * 60,
    mode: "pomodoro",
  },
  {
    id: "ss4",
    subjectId: "s2",
    subjectName: "Algoritmos",
    subjectColor: "#60a5fa",
    startedAt: hoursAgo(26),
    endedAt: hoursAgo(25),
    durationSeconds: 50 * 60,
    mode: "custom",
  },
  {
    id: "ss5",
    subjectId: "s4",
    subjectName: "Filosofia",
    subjectColor: "#fbbf24",
    startedAt: hoursAgo(30),
    endedAt: hoursAgo(29),
    durationSeconds: 25 * 60,
    mode: "free",
  },
];

export const mockGoals: Goal[] = [
  {
    id: "g1",
    type: "daily",
    metric: "hours",
    target: 4,
    current: 2.3,
    label: "Meta diária",
  },
  {
    id: "g2",
    type: "weekly",
    metric: "hours",
    target: 25,
    current: 17.2,
    label: "Meta semanal",
  },
  {
    id: "g3",
    type: "weekly",
    metric: "sessions",
    target: 30,
    current: 21,
    label: "Sessões da semana",
  },
];

export function generateHeatmap(): DayHeatmapEntry[] {
  const entries: DayHeatmapEntry[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1;
    const random = Math.random() * 2.5 * base;
    const seconds = Math.max(0, Math.round(random * 3600));
    entries.push({
      date: d.toISOString().slice(0, 10),
      seconds,
    });
  }
  return entries;
}

export const todayStats = {
  studiedSeconds: 2 * 3600 + 18 * 60,
  sessions: 3,
  focusPercentage: 86,
  streak: 12,
};

export const weekStats = {
  studiedSeconds: 17 * 3600 + 12 * 60,
  sessions: 21,
  averageDaily: (17 * 3600 + 12 * 60) / 7,
  bestDayLabel: "Quarta",
};

export function dailyHoursLast7Days() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return days.map((label) => ({
    day: label,
    hours: +(Math.random() * 4 + 1).toFixed(1),
  }));
}
