export const NOTIFY_STORAGE_KEY = "notedo:notify:v1";

/**
 * Preferências de notificação de prazos (provas/atividades). Ajustáveis pelo
 * usuário nas Configurações. Os horários são relativos ao prazo do item:
 * - dayBefore: 1 dia antes, no horário `morningTime`.
 * - morningOf: no dia do prazo, no horário `morningTime`.
 * - hourBefore: 1 hora antes do horário do prazo.
 * - overdue: quando o prazo passou e o item continua pendente (no próximo check).
 */
export type NotifySettings = {
  enabled: boolean;
  dayBefore: boolean;
  morningOf: boolean;
  /** "HH:MM" 24h — usado por dayBefore e morningOf. */
  morningTime: string;
  hourBefore: boolean;
  overdue: boolean;
};

export const DEFAULT_NOTIFY: NotifySettings = {
  enabled: true,
  dayBefore: true,
  morningOf: true,
  morningTime: "08:00",
  hourBefore: false,
  overdue: true,
};

export function loadNotifySettings(): NotifySettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFY;
  try {
    const raw = window.localStorage.getItem(NOTIFY_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFY;
    const parsed = JSON.parse(raw) as Partial<NotifySettings>;
    return { ...DEFAULT_NOTIFY, ...parsed };
  } catch {
    return DEFAULT_NOTIFY;
  }
}

export function saveNotifySettings(s: NotifySettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(s));
}

/** "08:00" -> { h: 8, m: 0 }. Tolerante a lixo (cai no default 8h). */
export function parseHHMM(v: string): { h: number; m: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return { h: 8, m: 0 };
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { h, m: min };
}
