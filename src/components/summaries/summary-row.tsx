"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteSummary } from "@/features/summaries/actions";

interface SummaryRowProps {
  summary: {
    id: string;
    title: string;
    updatedAt: Date;
  };
  subjectId: string;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d atrás`;
}

export function SummaryRow({ summary, subjectId }: SummaryRowProps) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Deletar "${summary.title}"?`)) return;
    setDeleting(true);
    const result = await deleteSummary(summary.id);
    setDeleting(false);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <Link
      href={`/subjects/${subjectId}/summary/${summary.id}`}
      className="group flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition-colors hover:bg-[var(--color-accent)]/40"
    >
      <FileText className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{summary.title}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          atualizado {relativeTime(new Date(summary.updatedAt))}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Deletar"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        {deleting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
    </Link>
  );
}
