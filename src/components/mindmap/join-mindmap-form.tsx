"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { joinMindmapByToken } from "@/features/mindmaps/collab";

/**
 * Entrar num mapa compartilhado por outra pessoa, colando o código de convite
 * (ou o link). Campo inline — sem prompt(), que não funciona no EXE/WebView2.
 */
export function JoinMindMapForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return setError("Cole o código de convite.");
    setBusy(true);
    setError(null);
    const r = await joinMindmapByToken(code);
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      setCode("");
      router.push(`/mindmap?id=${r.mapId}`);
    } else {
      setError(r.error);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <LogIn className="size-3.5" />
        Entrar em mapa compartilhado
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
    >
      <div className="flex-1 space-y-1">
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Cole o código de convite ou o link"
          className="h-9 w-full min-w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:border-[var(--color-ring)]"
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
      <Button type="submit" disabled={busy} className="gap-1.5">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
        Entrar
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Cancelar"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}
