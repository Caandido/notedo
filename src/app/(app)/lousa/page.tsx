"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { CanvasEditor } from "@/components/lousa/canvas-editor";
import { LousaView } from "@/components/lousa/lousa-view";

function Inner() {
  const id = useSearchParams().get("id");
  if (id) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] overflow-hidden md:h-dvh">
        <CanvasEditor id={id} />
      </div>
    );
  }
  return (
    <>
      <Header title="Lousa" subtitle="Quadros livres pra resolver exercícios" />
      <LousaView />
    </>
  );
}

export default function LousaPage() {
  return (
    <React.Suspense fallback={<PageLoading />}>
      <Inner />
    </React.Suspense>
  );
}
