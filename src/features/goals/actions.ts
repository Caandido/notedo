"use client";

import { cuid, db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { invalidateAll } from "@/lib/db/use-repo";

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
  if (label.length > 60)
    return { ok: false as const, error: "Label muito longo." };
  if (!["daily", "weekly", "monthly"].includes(input.type))
    return { ok: false as const, error: "Período inválido." };
  if (!["hours", "tasks", "sessions", "reviews"].includes(input.metric))
    return { ok: false as const, error: "Métrica inválida." };
  if (!Number.isFinite(input.target) || input.target <= 0 || input.target > 10000)
    return { ok: false as const, error: "Meta inválida." };

  const userId = getCurrentUserId();
  const now = Date.now();
  await db().goals.add({
    id: cuid(),
    userId,
    label,
    type: input.type.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY",
    metric: input.metric.toUpperCase() as
      | "HOURS"
      | "TASKS"
      | "SESSIONS"
      | "REVIEWS",
    target: input.target,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  invalidateAll();
  return { ok: true as const };
}

export type UpdateGoalInput = {
  id: string;
  label: string;
  target: number;
};

export async function updateGoal(input: UpdateGoalInput) {
  const label = input.label.trim();
  if (!label) return { ok: false as const, error: "Label obrigatório." };
  if (!Number.isFinite(input.target) || input.target <= 0)
    return { ok: false as const, error: "Meta inválida." };

  const userId = getCurrentUserId();
  const goal = await db().goals.get(input.id);
  if (!goal || goal.userId !== userId)
    return { ok: false as const, error: "Meta não encontrada." };

  await db().goals.update(input.id, {
    label,
    target: input.target,
    updatedAt: Date.now(),
  });
  invalidateAll();
  return { ok: true as const };
}

export async function deleteGoal(goalId: string) {
  const userId = getCurrentUserId();
  const goal = await db().goals.get(goalId);
  if (!goal || goal.userId !== userId)
    return { ok: false as const, error: "Meta não encontrada." };
  await db().goals.delete(goalId);
  invalidateAll();
  return { ok: true as const };
}

export async function toggleGoalActive(goalId: string, active: boolean) {
  const userId = getCurrentUserId();
  const goal = await db().goals.get(goalId);
  if (!goal || goal.userId !== userId)
    return { ok: false as const, error: "Meta não encontrada." };
  await db().goals.update(goalId, { active, updatedAt: Date.now() });
  invalidateAll();
  return { ok: true as const };
}
