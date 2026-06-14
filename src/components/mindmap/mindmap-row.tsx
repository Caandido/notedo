"use client";

import * as React from "react";
import Link from "next/link";
import { FileImage, LogOut, Network, Trash2, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { deleteMindMap } from "@/features/mindmaps/actions";
import { leaveMindmap } from "@/features/mindmaps/collab";
import type { MindMapListItem } from "@/lib/queries";

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

export function MindMapRowItem({ map }: { map: MindMapListItem }) {
  const [deleting, setDeleting] = React.useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (map.shared) {
      if (!confirm(`Sair do mapa compartilhado "${map.title}"?`)) return;
      setDeleting(true);
      await leaveMindmap(map.id);
      return;
    }
    if (!confirm(`Excluir o mapa "${map.title}"? Os slides serão removidos.`))
      return;
    setDeleting(true);
    await deleteMindMap(map.id);
  }

  return (
    <Link href={`/mindmap?id=${map.id}`} className="block">
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-[var(--color-accent)]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-secondary)]">
          <Network className="size-4 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {map.title}
            {(map.shared || map.sharedByMe) && (
              <Users
                className="size-3 shrink-0 text-[var(--color-muted-foreground)]"
                aria-label={map.shared ? "Compartilhado comigo" : "Compartilhado por mim"}
              />
            )}
          </p>
          <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span>{map.nodeCount} nó{map.nodeCount === 1 ? "" : "s"}</span>
            {map.slideCount > 0 && (
              <span className="flex items-center gap-1">
                <FileImage className="size-3" />
                {map.slideCount}
              </span>
            )}
            <span>· {relativeTime(map.updatedAt)}</span>
            {map.shared && <span>· compartilhado</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          aria-label={map.shared ? "Sair do mapa" : "Excluir mapa"}
          className="shrink-0 rounded-md p-2 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-rose-300 disabled:opacity-50"
        >
          {map.shared ? <LogOut className="size-4" /> : <Trash2 className="size-4" />}
        </button>
      </Card>
    </Link>
  );
}
