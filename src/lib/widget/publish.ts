"use client";

import { isCapacitor } from "@/lib/sync/client";
import { buildWidgetData } from "./data";

/** Chave compartilhada com o widget nativo (SharedPreferences CapacitorStorage). */
export const WIDGET_KEY = "widget";
/** Espelho em localStorage (web/debug e fallback). */
const WIDGET_LOCAL_KEY = "notedo:widget:v1";

/**
 * Publica o resumo do widget. No Android grava em Preferences (o provider Kotlin
 * lê de SharedPreferences "CapacitorStorage" / chave "widget") e dispara o
 * update do widget. No web/desktop é só o espelho em localStorage (no-op visual).
 */
export async function publishWidgetData(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const data = await buildWidgetData();
    const json = JSON.stringify(data);
    window.localStorage.setItem(WIDGET_LOCAL_KEY, json);

    if (isCapacitor) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: WIDGET_KEY, value: json });
      // Pede ao provider pra redesenhar (no-op se o plugin não existir).
      try {
        const w = window as unknown as {
          Capacitor?: { Plugins?: { NotedoWidget?: { update?: () => void } } };
        };
        w.Capacitor?.Plugins?.NotedoWidget?.update?.();
      } catch {
        /* sem plugin custom: o widget atualiza no próximo ciclo do SO */
      }
    }
  } catch (err) {
    console.warn("[widget] publish falhou:", err);
  }
}
