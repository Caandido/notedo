export type LocalUser = {
  id: string;
  name: string;
  email?: string;
  image?: string;
  createdAt: number;
};

export type SubjectRow = {
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
  updatedAt: number;
};

export type TopicRow = {
  id: string;
  subjectId: string;
  parentId: string | null;
  title: string;
  content: unknown;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type StudySessionRow = {
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

export type GoalRow = {
  id: string;
  userId: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  metric: "HOURS" | "TASKS" | "SESSIONS" | "REVIEWS";
  target: number;
  label: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ReviewRow = {
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

export type FlashcardRow = {
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

export type CalendarEventRow = {
  id: string;
  userId: string;
  subjectId: string | null;
  type: "EXAM" | "TASK" | "CLASS" | "CUSTOM";
  title: string;
  notes: string | null;
  date: number;
  done: boolean;
  createdAt: number;
  updatedAt: number;
};

export type GradeRow = {
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
  updatedAt: number;
};
