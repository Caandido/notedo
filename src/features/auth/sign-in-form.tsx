"use client";

import * as React from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase, redirectUrl, isNative } from "@/lib/sync/client";

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-ring)] focus:ring-2 focus:ring-[var(--color-ring)]/40";

type Msg = { type: "error" | "info"; text: string } | null;

export function SignInForm() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<Msg>(null);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setMsg({ type: "error", text: "Preencha e-mail e senha." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl() },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg({
            type: "info",
            text: "Conta criada! Se houver confirmação por e-mail, verifique sua caixa.",
          });
        }
      } else {
        const { error } = await supabase().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ type: "error", text: friendly(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setMsg({ type: "error", text: "Informe o e-mail para o link mágico." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl() },
      });
      if (error) throw error;
      setMsg({ type: "info", text: "Link enviado! Confira seu e-mail." });
    } catch (err) {
      setMsg({ type: "error", text: friendly(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl(), skipBrowserRedirect: isNative },
      });
      if (error) throw error;
      // Web: redireciona a página inteira. Nativo (Fase 6) abrirá o browser.
    } catch (err) {
      setMsg({ type: "error", text: friendly(err) });
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-[var(--color-border)] p-0.5 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setMsg(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === m
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {m === "signin" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form onSubmit={handlePassword} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            E-mail
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="voce@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Senha
          </label>
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleMagicLink}
        disabled={busy}
      >
        <Mail className="size-4" />
        Enviar link mágico
      </Button>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        ou
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={busy}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("github")}
          disabled={busy}
        >
          GitHub
        </Button>
      </div>

      {msg && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            msg.type === "error"
              ? "bg-red-500/10 text-red-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

function friendly(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha inválidos.";
  if (/Email not confirmed/i.test(m))
    return "E-mail ainda não confirmado. Verifique sua caixa.";
  if (/already registered/i.test(m)) return "Esse e-mail já tem conta. Entre.";
  if (/provider is not enabled/i.test(m))
    return "Esse login social ainda não foi configurado no Supabase.";
  return m;
}
