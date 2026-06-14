"use client";

import { supabase, hasSupabaseConfig } from "@/lib/sync/client";

/**
 * Gera (ou recupera) o link de assinatura do calendário do usuário. A Edge
 * Function `calendar` serve o feed iCal a partir do token. Devolve a URL https
 * (pra colar no Google Calendar) e a webcal:// (pra abrir no Apple/celular).
 */
export async function getCalendarSubscription() {
  if (!hasSupabaseConfig())
    return { ok: false as const, error: "Entre na sua conta pra assinar o calendário." };
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!base) return { ok: false as const, error: "Supabase não configurado." };
  try {
    const { data, error } = await supabase().rpc("ensure_calendar_token");
    if (error || !data) return { ok: false as const, error: "Falha ao gerar o link." };
    const token = String(data);
    const httpUrl = `${base}/functions/v1/calendar?token=${token}`;
    const webcal = httpUrl.replace(/^https?:\/\//, "webcal://");
    return { ok: true as const, httpUrl, webcal };
  } catch {
    return { ok: false as const, error: "Falha ao gerar o link." };
  }
}
