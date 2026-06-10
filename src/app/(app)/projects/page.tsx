"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { ProjectsView } from "@/components/projects/projects-view";

function ProjectsInner() {
  const board = useSearchParams().get("board") ?? undefined;
  return <ProjectsView initialBoardId={board} />;
}

export default function ProjectsPage() {
  return (
    <>
      <Header title="Projetos" subtitle="Kanban dos seus projetos de dev" />
      <React.Suspense fallback={<PageLoading />}>
        <ProjectsInner />
      </React.Suspense>
    </>
  );
}
