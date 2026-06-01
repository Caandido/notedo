"use client";

import { supabase, isCapacitor, isTauri } from "./client";

/**
 * OAuth nativo. O provedor sempre redireciona pra uma URL de callback contendo
 * `?code=...` (fluxo PKCE). Cada plataforma captura essa URL de um jeito:
 *
 * - **Android (Capacitor):** abre o browser do sistema; o retorno cai no scheme
 *   `app.notedo://auth-callback?code=...` via `appUrlOpen`.
 * - **Windows (Tauri):** abre o navegador do sistema e sobe um servidor loopback
 *   em `127.0.0.1:8788` (comando Rust `oauth_login`) que captura o redirect.
 *
 * Em ambos, trocamos o `code` por sessão com `exchangeCodeForSession(code)` — o
 * `code_verifier` (PKCE) está no localStorage da mesma webview que chamou
 * `signInWithOAuth`. No web nada disso roda (guardas isNative).
 */

/** Extrai o parâmetro `code` de uma URL/fragmento de callback. */
function extractAuthCode(url: string): string | null {
  const m = /[?&#]code=([^&#]+)/.exec(url);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Extrai uma mensagem de erro de OAuth da URL de callback, se houver. */
function extractAuthError(url: string): string | null {
  const m = /[?&#]error_description=([^&#]+)/.exec(url) ?? /[?&#]error=([^&#]+)/.exec(url);
  return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
}

/** Troca o `code` da URL de callback por uma sessão. Lança se vier erro. */
async function exchangeFromCallback(url: string): Promise<void> {
  const err = extractAuthError(url);
  if (err) throw new Error(err);
  const code = extractAuthCode(url);
  if (!code) return;
  const { error } = await supabase().auth.exchangeCodeForSession(code);
  if (error) throw error;
}

async function handleCallbackUrl(url: string): Promise<void> {
  try {
    if (!url.includes("auth-callback")) return;
    await exchangeFromCallback(url);
  } catch {
    // silencioso: se não houver code válido, ignora
  }
}

/**
 * Deep links de navegação do widget (ex.: `app.notedo://timer` do botão
 * "iniciar timer"). Roteia pra rota interna correspondente.
 */
function handleNavUrl(url: string): void {
  try {
    if (url.includes("auth-callback")) return;
    const m = /^app\.notedo:\/\/([a-z0-9/_-]+)/i.exec(url);
    const route = m?.[1]?.replace(/\/+$/, "");
    if (route) window.location.assign("/" + route);
  } catch {
    /* noop */
  }
}

let listenerReady = false;

export async function initNativeAuth(): Promise<void> {
  if (listenerReady) return;
  if (isCapacitor) {
    listenerReady = true;
    const { App } = await import("@capacitor/app");
    await App.addListener("appUrlOpen", ({ url }) => {
      handleNavUrl(url);
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
  // Tauri (Windows): o retorno do OAuth é capturado pelo loopback em openOAuthUrl
  // (comando Rust `oauth_login`), não por listener global.
}

/** Abre a URL de OAuth no navegador da plataforma (nativo) ou redireciona (web). */
export async function openOAuthUrl(url: string): Promise<void> {
  if (isCapacitor) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    // retorno via appUrlOpen → handleCallbackUrl
  } else if (isTauri) {
    // Sobe o loopback (porta 8788), abre o navegador do sistema e aguarda o
    // redirect com ?code=. O comando devolve o path do callback (ex.:
    // "/auth-callback?code=..."), que trocamos por sessão aqui.
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await invoke<string>("oauth_login", { url });
    await exchangeFromCallback("http://localhost:8788" + path);
  } else {
    window.location.href = url;
  }
}
