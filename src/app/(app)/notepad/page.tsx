"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { NotepadView } from "@/components/notepad/notepad-view";

function NotepadInner() {
  const id = useSearchParams().get("id") ?? undefined;
  return <NotepadView initialNoteId={id} />;
}

export default function NotepadPage() {
  return (
    <>
      <Header title="Bloco de notas" subtitle="Anotações rápidas e separadas" />
      <React.Suspense fallback={<PageLoading />}>
        <NotepadInner />
      </React.Suspense>
    </>
  );
}
