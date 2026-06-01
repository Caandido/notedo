"use client";

import * as React from "react";
import { Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/layout/page-loading";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getTrashItems, type TrashGroup } from "@/lib/queries";
import { TRASH_RETENTION_DAYS } from "@/lib/trash/retention";
import {
  deleteFromTrashForever,
  emptyTrashNow,
  restoreFromTrash,
} from "@/features/trash/actions";

function daysLeft(expiresAt: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000));
}

export function TrashView() {
  const { data, loading } = useRepoQuery(() => getTrashItems(), []);
  const [busy, setBusy] = React.useState<number | "empty" | null>(null);
  const [confirming, setConfirming] = React.useState<number | "empty" | null>(
    null
  );

  if (loading && !data) return <PageLoading />;
  const groups = data ?? [];

  async function restore(stamp: number) {
    setBusy(stamp);
    await restoreFromTrash(stamp);
    setBusy(null);
  }
  async function purge(stamp: number) {
    setBusy(stamp);
    await deleteFromTrashForever(stamp);
    setBusy(null);
    setConfirming(null);
  }
  async function empty() {
    setBusy("empty");
    await emptyTrashNow();
    setBusy(null);
    setConfirming(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Itens excluídos ficam aqui por {TRASH_RETENTION_DAYS} dias e depois são
          apagados automaticamente.
        </p>
        {groups.length > 0 &&
          (confirming === "empty" ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Apagar tudo?
              </span>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy !== null}
                onClick={() => void empty()}
              >
                Sim, esvaziar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-[var(--color-destructive)]"
              onClick={() => setConfirming("empty")}
            >
              <Trash2 className="size-3.5" />
              Esvaziar lixeira
            </Button>
          ))}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] py-16 text-center">
          <Trash2 className="size-8 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium">A lixeira está vazia</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Nada excluído por aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <TrashRow
              key={g.stamp}
              group={g}
              busy={busy === g.stamp}
              confirming={confirming === g.stamp}
              onRestore={() => void restore(g.stamp)}
              onAskPurge={() => setConfirming(g.stamp)}
              onCancel={() => setConfirming(null)}
              onPurge={() => void purge(g.stamp)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TrashRow({
  group,
  busy,
  confirming,
  onRestore,
  onAskPurge,
  onCancel,
  onPurge,
}: {
  group: TrashGroup;
  busy: boolean;
  confirming: boolean;
  onRestore: () => void;
  onAskPurge: () => void;
  onCancel: () => void;
  onPurge: () => void;
}) {
  const left = daysLeft(group.expiresAt);
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {group.typeLabel}
          </span>
          <span className="truncate text-sm font-medium">{group.title}</span>
          {group.count > 1 && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              +{group.count - 1}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {left === 0 ? "Apaga hoje" : `Apaga em ${left} dia${left > 1 ? "s" : ""}`}
        </p>
      </div>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="destructive" disabled={busy} onClick={onPurge}>
            Excluir
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onRestore}
            title="Restaurar"
          >
            <Undo2 className="size-3.5" />
            Restaurar
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            onClick={onAskPurge}
            aria-label="Excluir definitivamente"
            title="Excluir definitivamente"
            className="text-[var(--color-destructive)]"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
}