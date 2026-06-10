"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase, hasSupabaseConfig } from "@/lib/sync/client";
import { setSessionUserId } from "@/lib/auth";
import {
  ensureProfile,
  migrateAnonToAccount,
  wipeLocalData,
} from "@/lib/db/account";

export type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [user, setUser] = React.useState<User | null>(null);
  const lastUid = React.useRef<string | null>(null);

  const applySession = React.useCallback(async (session: Session | null) => {
    const u = session?.user ?? null;
    if (u) {
      setSessionUserId(u.id);
      // Só migra/garante perfil quando o usuário muda (evita writes repetidos
      // a cada refresh de token).
      if (lastUid.current !== u.id) {
        lastUid.current = u.id;
        await migrateAnonToAccount(u.id).catch(() => {});
        await ensureProfile(u.id, {
          name:
            (u.user_metadata?.name as string | undefined) ??
            (u.user_metadata?.full_name as string | undefined) ??
            u.email?.split("@")[0],
          email: u.email ?? undefined,
          image: u.user_metadata?.avatar_url as string | undefined,
        }).catch(() => {});
        // Fase 3: dispara o sync ao autenticar.
        void import("@/lib/sync/engine")
          .then((m) => m.startSyncForSession())
          .catch(() => {});
      }
      setUser(u);
      setStatus("authed");
    } else {
      lastUid.current = null;
      setSessionUserId(null);
      setUser(null);
      setStatus("anon");
    }
  }, []);

  React.useEffect(() => {
    if (!hasSupabaseConfig()) {
      setStatus("anon");
      return;
    }
    // Registra o listener de deep link OAuth no nativo (no-op no web).
    void import("@/lib/sync/native-auth")
      .then((m) => m.initNativeAuth())
      .catch(() => {});
    let mounted = true;
    void supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (mounted) void applySession(data.session);
      });
    const { data: sub } = supabase().auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = React.useCallback(async () => {
    // Logout apaga o cache local (db().delete()) pra não vazar dados entre contas.
    // Antes disso: tenta enviar o que está pendente; se ainda sobrar algo não
    // sincronizado (offline/erro), AVISA — pra nunca apagar dados não salvos calado.
    try {
      const engine = await import("@/lib/sync/engine");
      await engine.syncAll("signout").catch(() => {});
      const pending = await engine.countUnsynced().catch(() => 0);
      if (pending > 0) {
        const ok = window.confirm(
          `Você tem ${pending} alteração(ões) ainda NÃO sincronizada(s) com a nuvem.\n\n` +
            `Sair deste aparelho vai APAGAR esses dados locais — e, como não foram ` +
            `enviados, eles podem se perder.\n\nSair mesmo assim?`
        );
        if (!ok) return; // aborta o logout; continua logado e com os dados
      }
      engine.stopSync();
    } catch {
      const ok = window.confirm(
        "Não foi possível confirmar a sincronização antes de sair. Sair pode " +
          "apagar dados locais não enviados. Sair mesmo assim?"
      );
      if (!ok) return;
    }
    await supabase().auth.signOut().catch(() => {});
    await wipeLocalData().catch(() => {});
    setSessionUserId(null);
    lastUid.current = null;
    setUser(null);
    setStatus("anon");
  }, []);

  const value = React.useMemo(
    () => ({ status, user, signOut }),
    [status, user, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
