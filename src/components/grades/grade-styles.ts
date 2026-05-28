export type GradeType = "exam" | "assignment" | "quiz" | "other";

export const GRADE_TYPE_LABEL: Record<GradeType, string> = {
  exam: "Prova",
  assignment: "Trabalho",
  quiz: "Quiz",
  other: "Outro",
};

export const GRADE_TYPE_TONE: Record<
  GradeType,
  { dot: string; text: string; bg: string }
> = {
  exam: { dot: "bg-rose-400", text: "text-rose-300", bg: "bg-rose-500/10" },
  assignment: {
    dot: "bg-sky-400",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
  },
  quiz: {
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  other: {
    dot: "bg-violet-400",
    text: "text-violet-300",
    bg: "bg-violet-500/10",
  },
};

export function gradeColorByPercent(percent: number): string {
  if (percent >= 90) return "text-emerald-300";
  if (percent >= 70) return "text-sky-300";
  if (percent >= 60) return "text-amber-300";
  if (percent >= 50) return "text-orange-300";
  return "text-rose-300";
}
