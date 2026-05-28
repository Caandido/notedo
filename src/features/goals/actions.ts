"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type GoalType = "daily" | "weekly" | "monthly";
type GoalMetric = "hours" | "tasks" | "sessions" | "reviews";

export type CreateGoalInput = {
  label: string;
  type: GoalType;
  metric: GoalMetric;
  target: number;
};

export async function createGoal(input: CreateGoalInput) {
  const label = input.label.trim();
  if (!label) return { ok: false as const, error: "Label obrigatório." };
  if (label.length > 60) return { ok: false as const, error: "Label muito longo." };
  if (!["daily", "weekly", "monthly"].includes(input.type))
    return { ok: false as const, error: "Período inválido." };
  if (!["hours", "tasks", "sessions", "reviews"].includes(input.metric))
    return { ok: false as const, error: "Métrica inválida." };
  if (!Number.isFinite(input.target) || input.target <= 0 || input.target > 10000)
    return { ok: false as const, error: "Meta inválida." };

  const userId = await getCurrentUserId();

  await prisma.goal.create({
    data: {
      userId,
      label,
      type: input.type.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY",
      metric: input.metric.toUpperCase() as
        | "HOURS"
        | "TASKS"
        | "SESSIONS"
        | "REVIEWS",
      target: input.target,
    },
  });

  revalidatePath("/");
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function deleteGoal(goalId: string) {
  const userId = await getCurrentUserId();
  const deleted = await prisma.goal.deleteMany({
    where: { id: goalId, userId },
  });
  if (deleted.count === 0)
    return { ok: false as const, error: "Meta não encontrada." };
  revalidatePath("/");
  revalidatePath("/goals");
  return { ok: true as const };
}

export async function toggleGoalActive(goalId: string, active: boolean) {
  const userId = await getCurrentUserId();
  const updated = await prisma.goal.updateMany({
    where: { id: goalId, userId },
    data: { active },
  });
  if (updated.count === 0)
    return { ok: false as const, error: "Meta não encontrada." };
  revalidatePath("/");
  revalidatePath("/goals");
  return { ok: true as const };
}
