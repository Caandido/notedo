"use client";

import * as React from "react";
import { CalendarPlus, Check, Copy, ExternalLink, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCalendarSubscription } from "@/features/calendar/subscription";

/**
 * Assinar os eventos do Notedo no Google/Apple Calendar (atualiza sozinho).
 * - Google: "Outros calendários → A partir de URL" e cola o link https.
 * - Apple/celular: abre o link webcal:// direto.
 */
export function CalendarSubscribe() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [links, setLinks] = React.useState<{ httpUrl: string; webcal: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function openDialog() {
    setOpen(true);
    if (links) return;
    setLoading(true);
    setError(null);
    const r = await getCalendarSubscription();
    setLoading(false);
    if (r.ok) setLinks({ httpUrl: r.httpUrl, webcal: r.webcal });
    else setError(r.error);
  }

  async function copy() {
    if (!links) return;
    try {
      await navigator.clipboard.writeText(links.httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={openDialog}>
        <CalendarPlus className="size-3.5" />
        Assinar no celular/Google
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold">Assinar calendário</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Seus eventos aparecem no Google/Apple e atualizam sozinhos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-[var(--color-muted-foreground)]" />
              </div>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : links ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    Link de assinatura
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs">
                      {links.httpUrl}
                    </code>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
                      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      Copiar
                    </Button>
                  </div>
                </div>

                <a
                  href={links.webcal}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="size-3.5" />
                  Abrir no app de calendário (Apple/celular)
                </a>

                <div className="space-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-[11px] leading-snug text-[var(--color-muted-foreground)]">
                  <p className="font-medium text-[var(--color-foreground)]">No Google Calendar (PC):</p>
                  <p>
                    Outros calendários → <b>+</b> → “A partir de um URL” → cole o link
                    acima → Adicionar.
                  </p>
                  <p className="mt-1 font-medium text-[var(--color-foreground)]">No celular:</p>
                  <p>Toque em “Abrir no app de calendário” acima.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
