"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { PageLoading } from "@/components/layout/page-loading";
import { joinMindmapByToken } from "@/features/mindmaps/collab";

// O editor usa APIs de browser (ResizeObserver, canvas) — carrega só no cliente.
const MindMapEditor = dynamic(
  () => import("@/components/mindmap/mindmap-editor").then((m) => m.MindMapEditor),
  { ssr: false, loading: () => <PageLoading /> }
);

function EditorInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const join = params.get("join");
  // Link de convite (?join=código): entra como colaborador antes de abrir o mapa.
  const [joining, setJoining] = React.useState(Boolean(join));

  React.useEffect(() => {
    if (!join) return;
    let active = true;
    void joinMindmapByToken(join).finally(() => {
      if (active) setJoining(false);
    });
    return () => {
      active = false;
    };
  }, [join]);

  if (!id) {
    return (
      <div className="p-6 text-sm text-[var(--color-muted-foreground)]">
        Mapa não encontrado.
      </div>
    );
  }
  if (joining) return <PageLoading />;
  return <MindMapEditor id={id} />;
}

export default function MindMapPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <EditorInner />
    </React.Suspense>
  );
}
