"use client";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
  parseHHMM,
  type NotifySettings,
} from "./settings";

/** Um disparo concreto de notificação: o que mostrar e quando. */
export type Reminder = {
  /** id estável (item + tipo de lembrete) — idempotência ao reagendar. */
  key: string;
  /** id numérico estável para a API nativa do Capacitor. */
  numericId: number;
  title: string;
  body: string;
  /** ms epoch em que deve disparar. */
  at: number;
  /** rota a abrir ao tocar (deep link interno). */
  route: string;
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Hash estável string -> int positivo de 31 bits (id p/ Capacitor). */
function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0) % 2_000_000_000;
}

function atTimeOnDay(dueMs: number, time: string, dayOffset: number): number {
  const { h, m } = parseHHMM(time);
  const d = new Date(dueMs);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

type DueItem = {
  id: string;
  title: string;
  dueMs: number;
  kind: "PROVA" | "ATIVIDADE" | "EVENTO";
  route: string;
};

/** Provas/atividades pendentes (com prazo) que ainda têm lembrete relevante. */
async function collectDueItems(): Promise<DueItem[]> {
  const userId = getCurrentUserId();
  const [activities, events] = await Promise.all([
    db().activities.where("userId").equals(userId).toArray(),
    db().events.where("userId").equals(userId).toArray(),
  ]);

  const items: DueItem[] = [];

  for (const a of activities) {
    if (a.trashedAt != null) continue;
    if (a.status === "DONE") continue;
    if (a.dueDate == null) continue;
    items.push({
      id: `act:${a.id}`,
      title: a.title,
      dueMs: a.dueDate,
      kind: a.type === "PROVA" ? "PROVA" : "ATIVIDADE",
      route: `/activity?id=${a.id}`,
    });
  }

  // Eventos do calendário tipo prova/tarefa não concluídos. Pulamos os que são
  // espelho de uma atividade (mesmo id) pra não duplicar a notificação.
  const activityIds = new Set(activities.map((a) => a.id));
  for (const e of events) {
    if (e.trashedAt != null) continue;
    if (e.done) continue;
    if (e.type !== "EXAM" && e.type !== "TASK") continue;
    if (activityIds.has(e.id)) continue;
    items.push({
      id: `evt:${e.id}`,
      title: e.title,
      dueMs: e.date,
      kind: "EVENTO",
      route: `/calendar`,
    });
  }

  return items;
}

function label(kind: DueItem["kind"]): string {
  if (kind === "PROVA") return "Prova";
  if (kind === "ATIVIDADE") return "Atividade";
  return "Evento";
}

/**
 * Expande os itens em disparos concretos conforme as preferências.
 * `now` permite testar; só inclui disparos futuros (at > now), exceto overdue.
 */
export async function collectReminders(
  s: NotifySettings,
  now: number = Date.now()
): Promise<Reminder[]> {
  if (!s.enabled) return [];
  const items = await collectDueItems();
  const out: Reminder[] = [];

  const push = (
    item: DueItem,
    suffix: string,
    at: number,
    title: string,
    body: string
  ) => {
    const key = `${item.id}#${suffix}`;
    out.push({ key, numericId: hashId(key), title, body, at, route: item.route });
  };

  for (const item of items) {
    const tag = label(item.kind);

    if (s.dayBefore) {
      const at = atTimeOnDay(item.dueMs, s.morningTime, -1);
      if (at > now && at < item.dueMs) {
        push(item, "day", at, `${tag} amanhã`, `${item.title} é amanhã.`);
      }
    }
    if (s.morningOf) {
      const at = atTimeOnDay(item.dueMs, s.morningTime, 0);
      if (at > now && at <= item.dueMs + DAY) {
        push(item, "morn", at, `${tag} hoje`, `${item.title} é hoje.`);
      }
    }
    if (s.hourBefore) {
      const at = item.dueMs - HOUR;
      if (at > now) {
        push(item, "hour", at, `${tag} em 1 hora`, `${item.title} está chegando.`);
      }
    }
    if (s.overdue && item.dueMs < now) {
      // dispara "agora" (no próximo check em foreground / agendamento imediato).
      push(
        item,
        "over",
        now + 1000,
        `${tag} atrasada`,
        `${item.title} passou do prazo.`
      );
    }
  }

  out.sort((a, b) => a.at - b.at);
  return out;
}
