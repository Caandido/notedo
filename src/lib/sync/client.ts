"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Plataforma atual — define flow de OAuth e detectSessionInUrl. */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export const isCapacitor =
  typeof window !== "undefined" &&
  Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.()
  );
export const isNative = isTauri || isCapacitor;

export function hasSupabaseConfig(): boolean {
  return Boolean(URL && ANON);
}

let _client: SupabaseClient | null = null;

/** Singleton do cliente Supabase (lazy — só instancia no browser/webview). */
export function supabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(URL, ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !isNative,
        flowType: isNative ? "pkce" : "implicit",
      },
    });
  }
  return _client;
}

/** URL de retorno pós-OAuth/magic-link, por plataforma. */
export function redirectUrl(): string {
  if (typeof window === "undefined") return "";
  if (isCapacitor) return "app.notedo://auth-callback";
  // 127.0.0.1 (não "localhost") pra casar com o bind IPv4 do loopback no Rust —
  // no Windows "localhost" pode resolver pra ::1 (IPv6) e recusar a conexão.
  if (isTauri) return "http://127.0.0.1:8788/auth-callback";
  return window.location.origin + "/";
}
