"use client";

import { getOrInitLocalUser } from "@/lib/db";

// Id da sessão Supabase autenticada. Setado pelo AuthProvider em onAuthStateChange.
// É um módulo-level var (não React state) porque queries/actions chamam
// getCurrentUserId() fora do React.
let _sessionUserId: string | null = null;

export function setSessionUserId(id: string | null): void {
  _sessionUserId = id;
}

export function getCurrentUserId(): string {
  if (_sessionUserId) return _sessionUserId;
  // Fallback anônimo (pré-login). Com login obrigatório, raramente usado.
  return getOrInitLocalUser();
}
