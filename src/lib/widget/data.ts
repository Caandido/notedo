"use client";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

/** Resumo compacto consumido pelo widget Android (lido via Preferences). */
export type WidgetData = {
  /** Próximo prazo (prova/atividade) pendente. */
  next: { title: string; daysLeft: number; due: number } | null;
  /** Tempo estudado hoje. */
  todaySeconds: number;
  /** Dias seguidos estudando. */
  streak: number;
  /** Meta diária principal (horas ou sessões), se houver. */
  goal: { label: string; current: number; target: number; unit: string } | null;
  /** ms epoch da geração (debug). */
  generatedAt: number;
};

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Próximo prazo pendente (atividade não concluída ou evento prova/tarefa). */
async function nextDeadline(): Promise<WidgetData["next"]> {
  const userId = getCurrentUserId();
  const from = startOfToday();
  const [acts, events] = await Promise.all([
    db().activities.where("userId").equals(userId).toArray(),
    db().events.where("userId").equals(userId).toArray(),
  ]);

  const candidates: { title: string; due: number }[] = [];
  for (const a of acts) {
    if (a.trashedAt != null || a.status === "DONE" || a.dueDate == null) continue;
    if (a.dueDate < from) continue;
    candidates.push({ title: a.title, due: a.dueDate });
  }
  const actIds = new Set(acts.map((a) => a.id));
  for (const e of events) {
    if (e.trashedAt != null || e.done) continue;
    if (e.type !== "EXAM" && e.type !== "TASK") continue;
    if (actIds.has(e.id)) continue;
    if (e.date < from) continue;
    candidates.push({ title: e.title, due: e.date });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.due - b.due);
  const c = candidates[0];
  // Diferença em dias de CALENDÁRIO (início do dia do prazo - início de hoje),
  // pra "amanhã" não virar "em 2 dias" só porque é de tarde.
  const dueDay = new Date(c.due);
  dueDay.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.round((dueDay.getTime() - from) / 86_400_000));
  return { title: c.title, daysLeft, due: c.due };
}

/** Monta o resumo do widget a partir dos dados locais. */
export async function buildWidgetData(): Promise<WidgetData> {
  const [dash, next] = await Promise.all([getDashboardData(), nextDeadline()]);

  const dailyGoal = dash.goals.find(
    (g) => g.type === "daily" && (g.metric === "hours" || g.metric === "sessions")
  );

  return {
    next,
    todaySeconds: dash.today.studiedSeconds,
    streak: dash.today.streak,
    goal: dailyGoal
      ? {
          label: dailyGoal.label,
          current: dailyGoal.current,
          target: dailyGoal.target,
          unit: dailyGoal.metric === "hours" ? "h" : "sessões",
        }
      : null,
    generatedAt: Date.now(),
  };
}
