"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { PageLoading } from "@/components/layout/page-loading";
import { CardEditor } from "@/components/projects/card-editor";

function EditorInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const board = params.get("board") ?? undefined;
  if (!id) {
    return (
      <div className="p-6 text-sm text-[var(--color-muted-foreground)]">
        Card não encontrado.
      </div>
    );
  }
  return <CardEditor id={id} boardId={board} />;
}

export default function CardPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <EditorInner />
    </React.Suspense>
  );
}
