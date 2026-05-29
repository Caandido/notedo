"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { PageLoading } from "@/components/layout/page-loading";

// O editor usa APIs de browser (ResizeObserver, canvas) — carrega só no cliente.
const MindMapEditor = dynamic(
  () => import("@/components/mindmap/mindmap-editor").then((m) => m.MindMapEditor),
  { ssr: false, loading: () => <PageLoading /> }
);

function EditorInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="p-6 text-sm text-[var(--color-muted-foreground)]">
        Mapa não encontrado.
      </div>
    );
  }
  return <MindMapEditor id={id} />;
}

export default function MindMapPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <EditorInner />
    </React.Suspense>
  );
}
