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
    void import("@/lib/sync/engine")
      .then((m) => m.stopSync())
      .catch(() => {});
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
