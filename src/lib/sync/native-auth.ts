"use client";

import { supabase, isCapacitor, isTauri } from "./client";

/**
 * OAuth nativo (Android/Capacitor): o provider redireciona pra
 * `app.notedo://auth-callback?code=...`; o app intercepta via appUrlOpen e
 * troca o code por sessão (PKCE). No web nada disso roda (guardas isNative).
 */

async function handleCallbackUrl(url: string): Promise<void> {
  try {
    if (!url.includes("auth-callback")) return;
    await supabase().auth.exchangeCodeForSession(url);
  } catch {
    // silencioso: se não houver code válido, ignora
  }
}

let listenerReady = false;

export async function initNativeAuth(): Promise<void> {
  if (listenerReady) return;
  if (isCapacitor) {
    listenerReady = true;
    const { App } = await import("@capacitor/app");
    await App.addListener("appUrlOpen", ({ url }) => {
      void handleCallbackUrl(url).then(async () => {
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.close();
        } catch {
          /* noop */
        }
      });
    });
  }
  // Tauri (Windows): OAuth social via deep-link/loopback ainda não implementado;
  // e-mail/senha + magic link cobrem o desktop. Ver supabase/OAUTH.md.
}

/** Abre a URL de OAuth no navegador da plataforma (nativo) ou redireciona (web). */
export async function openOAuthUrl(url: string): Promise<void> {
  if (isCapacitor) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
  } else if (isTauri) {
    // sem fluxo nativo ainda; abre no webview como fallback
    window.location.href = url;
  } else {
    window.location.href = url;
  }
}
