"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, LogOut, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  disableMindmapShare,
  enableMindmapShare,
  getMindmapCollaborators,
  leaveMindmap,
  removeCollaborator,
  type Collaborator,
} from "@/features/mindmaps/collab";

/** Link de convite quando estamos num domínio web real (não nativo/localhost). */
function buildLink(mapId: string, token: string): string | null {
  if (typeof window === "undefined") return null;
  const origin = window.location.origin;
  if (!/^https?:\/\//.test(origin)) return null;
  if (/localhost|127\.0\.0\.1|tauri/.test(origin)) return null;
  return `${origin}/mindmap?id=${mapId}&join=${token}`;
}

export function ShareDialog({
  mapId,
  isOwner,
  initialToken,
  onClose,
  onShared,
}: {
  mapId: string;
  isOwner: boolean;
  initialToken: string | null;
  onClose: () => void;
  /** Avisa o editor que o token mudou (liga/desliga colaboração ao vivo). */
  onShared: (token: string | null) => void;
}) {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(initialToken);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<"code" | "link" | null>(null);
  const [collabs, setCollabs] = React.useState<Collaborator[] | null>(null);

  const link = token ? buildLink(mapId, token) : null;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadCollabs = React.useCallback(async () => {
    if (!isOwner) return;
    setCollabs(await getMindmapCollaborators(mapId));
  }, [isOwner, mapId]);

  React.useEffect(() => {
    if (isOwner && token) void loadCollabs();
  }, [isOwner, token, loadCollabs]);

  async function enable() {
    setBusy(true);
    setError(null);
    const r = await enableMindmapShare(mapId);
    setBusy(false);
    if (r.ok) {
      setToken(r.token);
      onShared(r.token);
    } else setError(r.error);
  }

  async function stop() {
    setBusy(true);
    setError(null);
    const r = await disableMindmapShare(mapId);
    setBusy(false);
    if (r.ok) {
      setToken(null);
      setCollabs(null);
      onShared(null);
    } else setError(r.error);
  }

  async function copy(value: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  }

  async function leave() {
    setBusy(true);
    await leaveMindmap(mapId);
    router.push("/mindmaps");
  }

  async function kick(userId: string) {
    await removeCollaborator(mapId, userId);
    void loadCollabs();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Users className="size-4" />
              Compartilhar mapa
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Convide outras pessoas pra editar junto, em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {!isOwner ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Você está colaborando neste mapa. As edições aparecem pra todos.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-rose-300"
              onClick={() => void leave()}
              disabled={busy}
            >
              <LogOut className="size-3.5" />
              Sair do mapa
            </Button>
          </div>
        ) : !token ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Gere um código de convite. Quem tiver o código abre o mapa e edita
              junto com você.
            </p>
            <Button onClick={() => void enable()} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
              Ativar compartilhamento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Código de convite
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm">
                  {token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void copy(token, "code")}
                >
                  {copied === "code" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  Copiar
                </Button>
              </div>
              <p className="text-[11px] text-[var(--color-muted-foreground)]">
                A outra pessoa entra em Mapas mentais → “Entrar em mapa
                compartilhado” e cola o código.
              </p>
            </div>

            {link && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  Link
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs">
                    {link}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void copy(link, "link")}
                  >
                    {copied === "link" ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    Copiar
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Colaboradores
              </label>
              {collabs === null ? (
                <p className="text-xs text-[var(--color-muted-foreground)]">Carregando…</p>
              ) : collabs.length === 0 ? (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Ninguém entrou ainda.
                </p>
              ) : (
                <ul className="space-y-1">
                  {collabs.map((c) => (
                    <li
                      key={c.userId}
                      className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm"
                    >
                      <span className="truncate">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => void kick(c.userId)}
                        className="text-xs text-[var(--color-muted-foreground)] hover:text-rose-300"
                      >
                        remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <p className="text-xs text-rose-300">{error}</p>}

            <div className="flex justify-between border-t border-[var(--color-border)] pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[var(--color-muted-foreground)]"
                onClick={() => void stop()}
                disabled={busy}
              >
                Parar de compartilhar
              </Button>
              <Button size="sm" onClick={onClose}>
                Pronto
              </Button>
            </div>
          </div>
        )}

        {!token && error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
      </div>
    </div>
  );
}
