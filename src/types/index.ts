export type Subject = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  priority?: "low" | "medium" | "high";
  totalSeconds: number;
  progress: number;
  tags: string[];
  createdAt: Date;
};

export type StudySession = {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
  mode: "pomodoro" | "free" | "reverse" | "custom";
  notes?: string;
};

export type Goal = {
  id: string;
  type: "daily" | "weekly" | "monthly";
  metric: "hours" | "tasks" | "sessions" | "reviews";
  target: number;
  current: number;
  label: string;
};

export type Topic = {
  id: string;
  subjectId: string;
  title: string;
  totalSeconds: number;
  parentId?: string | null;
};

export type DayHeatmapEntry = {
  date: string;
  seconds: number;
};
