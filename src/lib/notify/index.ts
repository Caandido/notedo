"use client";

import { isCapacitor, isTauri } from "@/lib/sync/client";
import { collectReminders, type Reminder } from "./reminders";
import { loadNotifySettings } from "./settings";

// ─── Permissão ───────────────────────────────────────────────────────────────

/** Pede/garante permissão de notificação na plataforma atual. */
export async function ensurePermission(): Promise<boolean> {
  try {
    if (isCapacitor) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const cur = await LocalNotifications.checkPermissions();
      if (cur.display === "granted") return true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === "granted";
    }
    if (isTauri) {
      const m = await import("@tauri-apps/plugin-notification");
      if (await m.isPermissionGranted()) return true;
      return (await m.requestPermission()) === "granted";
    }
    // Web
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

async function hasPermission(): Promise<boolean> {
  try {
    if (isCapacitor) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      return (await LocalNotifications.checkPermissions()).display === "granted";
    }
    if (isTauri) {
      const m = await import("@tauri-apps/plugin-notification");
      return await m.isPermissionGranted();
    }
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  } catch {
    return false;
  }
}

// ─── Android: agendamento no SO (dispara com app fechado) ────────────────────

async function scheduleAndroid(reminders: Reminder[]): Promise<void> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  // Cancela os agendamentos anteriores (reagendamento idempotente).
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  if (!reminders.length) return;
  await LocalNotifications.schedule({
    notifications: reminders.slice(0, 64).map((r) => ({
      id: r.numericId,
      title: r.title,
      body: r.body,
      schedule: { at: new Date(r.at), allowWhileIdle: true },
      extra: { route: r.route },
    })),
  });
}

// ─── Tauri/Web: verificador em foreground (app aberto) ───────────────────────
//
// Sem agendador em background, disparamos os lembretes cujo horário já passou
// enquanto o app está aberto. Um set persistido evita repetir o mesmo disparo.

const FIRED_KEY = "notedo:notify:fired:v1";

function loadFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}
function saveFired(map: Record<string, number>) {
  // Poda entradas com mais de 30 dias pra não crescer sem limite.
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const pruned: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) if (v > cutoff) pruned[k] = v;
  localStorage.setItem(FIRED_KEY, JSON.stringify(pruned));
}

async function fireForeground(reminders: Reminder[]): Promise<void> {
  const now = Date.now();
  const fired = loadFired();
  const due = reminders.filter((r) => r.at <= now + 1500 && !fired[r.key]);
  if (!due.length) return;

  for (const r of due) {
    try {
      if (isTauri) {
        const m = await import("@tauri-apps/plugin-notification");
        m.sendNotification({ title: r.title, body: r.body });
      } else if (typeof Notification !== "undefined") {
        const n = new Notification(r.title, { body: r.body });
        n.onclick = () => {
          window.focus();
          window.location.assign(r.route);
        };
      }
      fired[r.key] = now;
    } catch {
      /* ignora falha individual */
    }
  }
  saveFired(fired);
}

// ─── API pública ─────────────────────────────────────────────────────────────

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let tapListenerReady = false;

/** No Android, tocar a notificação abre a rota do item (extra.route). */
async function ensureTapListener(): Promise<void> {
  if (tapListenerReady || !isCapacitor) return;
  tapListenerReady = true;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action) => {
        const route = action.notification.extra?.route as string | undefined;
        if (route) window.location.assign(route);
      }
    );
  } catch {
    tapListenerReady = false;
  }
}

/** Recalcula e (re)agenda/dispara todos os lembretes conforme as preferências. */
export async function rescheduleAll(): Promise<void> {
  if (typeof window === "undefined") return;
  const settings = loadNotifySettings();
  if (!settings.enabled) {
    await cancelAll();
    return;
  }
  if (!(await hasPermission())) return;

  const reminders = await collectReminders(settings);
  try {
    if (isCapacitor) {
      await scheduleAndroid(reminders);
    } else {
      await fireForeground(reminders);
    }
  } catch (err) {
    console.warn("[notify] reschedule falhou:", err);
  }
}

/** Cancela tudo (master switch desligado). */
export async function cancelAll(): Promise<void> {
  try {
    if (isCapacitor) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
    }
  } catch {
    /* noop */
  }
}

/**
 * Liga o serviço: reagenda no startup e, em foreground (Tauri/web), verifica
 * periodicamente. No Android o SO cuida do disparo, então o intervalo só
 * mantém os agendamentos atualizados.
 */
export function startNotifications(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  void ensureTapListener();
  void rescheduleAll();
  timer = setInterval(() => {
    if (document.visibilityState === "visible") void rescheduleAll();
  }, 60_000);
}

export function stopNotifications(): void {
  started = false;
  if (timer) clearInterval(timer);
  timer = null;
}
