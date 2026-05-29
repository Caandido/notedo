"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { PageLoading } from "@/components/layout/page-loading";
import { ActivityEditor } from "@/components/activities/activity-editor";

function EditorInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="p-6 text-sm text-[var(--color-muted-foreground)]">
        Atividade não encontrada.
      </div>
    );
  }
  return <ActivityEditor id={id} />;
}

export default function ActivityPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <EditorInner />
    </React.Suspense>
  );
}
