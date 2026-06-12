"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilRuler, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getCanvasesForUser } from "@/lib/queries";
import { createCanvas } from "@/features/lousa/actions";

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function LousaView() {
  const router = useRouter();
  const { data, loading } = useRepoQuery(() => getCanvasesForUser(), []);

  async function onNew() {
    const res = await createCanvas();
    if (res.ok) router.push(`/lousa?id=${res.id}`);
  }

  if (loading && !data) {
    return (
      <p className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">Carregando…</p>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Button onClick={onNew} className="gap-1.5">
        <Plus className="size-3.5" />
        Nova lousa
      </Button>

      {!data || data.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <PencilRuler className="size-5 text-[var(--color-muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">Nenhuma lousa ainda</h2>
            <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
              Quadros livres pra resolver exercícios: caneta, formas, texto,
              equações (LaTeX) e imagens, num canvas infinito.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/lousa?id=${c.id}`)}
              className="flex aspect-[4/3] flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left transition-colors hover:border-[var(--color-ring)]"
            >
              <PencilRuler className="size-5 text-[var(--color-muted-foreground)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.title || "Sem título"}</p>
                <p className="text-[11px] text-[var(--color-muted-foreground)]">
                  {c.elementCount} {c.elementCount === 1 ? "item" : "itens"} · {formatWhen(c.updatedAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
